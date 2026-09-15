#!/usr/bin/env bash
#
# Demo data on a test server: look at it, top it up, or start over.
#
#   sudo bash seed-demo.sh                    what is in the database
#   sudo bash seed-demo.sh --transport        add the demo transport records
#   sudo bash seed-demo.sh --transport --fresh  replace them
#   sudo bash seed-demo.sh --reset            wipe everything and seed it again
#
# Why --transport exists on its own: deploy.sh seeds demo data only into a
# database with no families at all, because the demo seeder inserts rather
# than upserts and a second pass collides on the first bank account it
# creates. So a server seeded before a feature existed gets that feature's
# tables from the migrations and nothing in them, with no way to fill them
# short of starting over. This is the way.
#
# Everything here writes invented records, so everything here refuses to run
# where any family is not demo data - the same DEMO-prefix marker the money
# harnesses check. A real install cannot acquire invented bus riders by
# somebody typing the wrong command on the wrong machine.

set -euo pipefail

HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=common.sh
source "$HERE/common.sh"

APP_USER="${APP_USER:-amaso}"
APP_DIR="${APP_DIR:-/var/www/amaso}"

ACTION="status"
FRESH=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --transport) ACTION="transport"; shift ;;
        --reset)     ACTION="reset"; shift ;;
        --status)    ACTION="status"; shift ;;
        --fresh)     FRESH=1; shift ;;
        -h|--help)   awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' \
                         "${BASH_SOURCE[0]}"; exit 0 ;;
        *)           die "Unknown option '$1'. Try --transport, --reset, --status or --help." ;;
    esac
done

need_root
id "$APP_USER" >/dev/null 2>&1 || die "User '$APP_USER' does not exist - run provision.sh first."
[[ -f "$APP_DIR/backend/artisan" ]] || die "$APP_DIR/backend/artisan not found - run deploy.sh first."

as_app() { sudo -u "$APP_USER" -H "$@"; }
artisan() { as_app php "$APP_DIR/backend/artisan" "$@"; }

# One row of numbers out of the database, without needing its password: the
# application already has it, and tinker is the shortest way to borrow it.
counts() {
    artisan tinker --execute='
        $t = fn ($table) => \Illuminate\Support\Facades\DB::table($table)->count();
        printf("%d|%d|%d|%d|%d|%d|%d|%d",
            $t("widows"),
            \Illuminate\Support\Facades\DB::table("widows")->where("national_id", "not like", "DEMO%")->count(),
            $t("orphans"), $t("incomes"), $t("expenses"),
            $t("transport_support"), $t("transport_months"), $t("transport_month_lines"));
    ' 2>/dev/null | tail -1
}

read_counts() {
    local raw
    raw="$(counts)"
    IFS='|' read -r WIDOWS REAL ORPHANS INCOMES EXPENSES SUPPORT MONTHS LINES <<< "$raw"
    # A blank anywhere means tinker could not reach the database; treating
    # that as zero would let --reset run against a server it cannot see.
    [[ -n "${LINES:-}" ]] || die "Could not read the database. Check: sudo bash $HERE/status.sh"
}

show() {
    log "What is in the database"
    printf '    %-24s %s\n' "families" "$WIDOWS"
    printf '    %-24s %s\n' "orphans" "$ORPHANS"
    printf '    %-24s %s\n' "incomes / expenses" "$INCOMES / $EXPENSES"
    printf '    %-24s %s\n' "transport records" "$SUPPORT"
    printf '    %-24s %s\n' "transport months" "$MONTHS ($LINES line(s))"

    if (( WIDOWS == 0 )); then
        meh_line "empty - deploy.sh --demo would seed it"
    elif (( REAL > 0 )); then
        printf '\n    %s%d family record(s) are NOT demo data - this looks like a real install.%s\n' \
            "$C_ERR" "$REAL" "$C_OFF"
        printf '    Nothing in this script will touch it.\n'
    else
        printf '\n    %sAll %d families are demo data.%s\n' "$C_OK" "$WIDOWS" "$C_OFF"
    fi
    printf '\n'
}

meh_line() { printf '\n    %s%s%s\n' "$C_WARN" "$1" "$C_OFF"; }

# The one check that matters. Everything below writes invented records.
refuse_if_real() {
    if (( WIDOWS > 0 && REAL > 0 )); then
        die "$REAL family record(s) are not demo data. This script only ever writes invented records, so it will not touch this database."
    fi
}

read_counts

case "$ACTION" in

status)
    show
    ;;

# -------------------------------------------------------------------------
transport)
    show
    refuse_if_real

    if (( WIDOWS == 0 )); then
        die "There are no families to give transport to. Seed the demo data first: sudo bash $HERE/seed-demo.sh --reset"
    fi

    log "Seeding the demo transport records"
    if (( FRESH )); then
        warn "--fresh: the existing transport records will be replaced."
    fi

    as_app env SEED_TRANSPORT_FRESH="$FRESH" \
        php "$APP_DIR/backend/artisan" db:seed --class=TransportDemoSeeder --force

    read_counts
    ok "$SUPPORT transport record(s), $MONTHS month(s), $LINES line(s)"
    printf '\n    Open it at:  التتبع الدراسي  ->  النقل\n\n'
    ;;

# -------------------------------------------------------------------------
reset)
    show
    refuse_if_real

    printf '%s    This DROPS EVERY TABLE and seeds invented data in its place.%s\n' "$C_ERR" "$C_OFF"
    printf '    Everything entered through the application is lost, including\n'
    printf '    any accounts whose passwords were changed.\n\n'
    read -r -p "    Type 'reset' to go ahead: " answer
    [[ "$answer" == "reset" ]] || die "Nothing was changed."

    # A backup first, even of demo data: it is the only way back from a
    # mistyped confirmation, and it costs a couple of seconds.
    if [[ -x "$HERE/backup.sh" || -f "$HERE/backup.sh" ]]; then
        log "Taking a backup first"
        bash "$HERE/backup.sh" --now || warn "The backup failed - carrying on, as you asked for a reset."
    fi

    log "Rebuilding the database"
    artisan migrate:fresh --force
    artisan db:seed --force
    artisan db:seed --class=DemoDataSeeder --force

    # The application caches the configuration in production; a stale cache
    # after a rebuild is the kind of thing that looks like a broken deploy.
    artisan config:clear >/dev/null 2>&1 || true
    artisan cache:clear >/dev/null 2>&1 || true
    artisan config:cache >/dev/null 2>&1 || true

    read_counts
    log "Done"
    show
    cat <<SUMMARY
    Sign in with  the account and password printed above while seeding

SUMMARY
    ;;
esac
