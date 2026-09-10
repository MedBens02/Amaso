#!/usr/bin/env bash
#
# Backs up the AMASO database.
#
#   sudo bash backup.sh                 take a backup now
#   sudo bash backup.sh --install-cron  take one nightly at 02:30
#   sudo bash backup.sh --list          show what is stored
#   sudo bash backup.sh --restore FILE  put a backup back
#
# Backups are gzipped SQL, written to /var/backups/amaso, and the last 30
# are kept. The whole database is a few megabytes, so a full dump every
# night costs almost nothing and restores in one command - which is worth
# more here than anything cleverer.
#
# A copy that lives on the same machine as the database protects against
# a mistake, not against losing the machine. Copy these off the server as
# well; the guide explains how.

set -euo pipefail

DB_NAME="${DB_NAME:-amaso}"
DB_USER="${DB_USER:-amaso}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/amaso}"
KEEP="${KEEP:-30}"
PASS_FILE="/root/.amaso-db-password"

ok()   { printf '    \033[0;32m[ok]\033[0m %s\n' "$*"; }
warn() { printf '    \033[0;33m[!]\033[0m %s\n' "$*"; }
die()  { printf '\n\033[0;31m[x] %s\033[0m\n\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root."
[[ -f "$PASS_FILE" ]] || die "$PASS_FILE is missing - re-run provision.sh"
DB_PASS="$(cat "$PASS_FILE")"

# --credentials on the command line would show the password in `ps` to
# every user on the box; a defaults file keeps it out of the process list.
CNF="$(mktemp)"
trap 'rm -f "$CNF"' EXIT
chmod 600 "$CNF"
cat > "$CNF" <<CNFEOF
[client]
user=${DB_USER}
password=${DB_PASS}
host=127.0.0.1
CNFEOF

case "${1:-}" in

# ---------------------------------------------------------------------------
--install-cron)
    script_path="$(readlink -f "$0")"
    cat > /etc/cron.d/amaso-backup <<CRONEOF
# Nightly AMASO database backup. Output goes to the system log.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
30 2 * * * root ${script_path} >> /var/log/amaso-backup.log 2>&1
CRONEOF
    chmod 644 /etc/cron.d/amaso-backup
    ok "Nightly backup scheduled for 02:30, logging to /var/log/amaso-backup.log"
    ok "Remove it with:  rm /etc/cron.d/amaso-backup"
    exit 0
    ;;

# ---------------------------------------------------------------------------
--list)
    [[ -d "$BACKUP_DIR" ]] || die "No backups yet ($BACKUP_DIR does not exist)."
    printf '\n  Backups in %s\n\n' "$BACKUP_DIR"
    ls -lh --time-style=long-iso "$BACKUP_DIR"/*.sql.gz 2>/dev/null \
        | awk '{printf "    %-10s  %s %s  %s\n", $5, $6, $7, $8}' \
        || die "No backups yet."
    printf '\n'
    exit 0
    ;;

# ---------------------------------------------------------------------------
--restore)
    FILE="${2:-}"
    [[ -n "$FILE" ]] || die "Usage: sudo bash backup.sh --restore /var/backups/amaso/<file>.sql.gz"
    [[ -f "$FILE" ]] || die "$FILE not found."

    printf '\n\033[0;33m  This replaces every row in "%s" with the contents of\n' "$DB_NAME"
    printf '  %s. Anything entered since that backup is lost.\033[0m\n\n' "$FILE"
    read -r -p "  Type the database name to confirm: " answer
    [[ "$answer" == "$DB_NAME" ]] || die "Not confirmed - nothing was changed."

    # Take a copy of what is there now first. A restore is usually done in
    # a hurry, and "the backup was the wrong one" is a bad place to end up.
    safety="${BACKUP_DIR}/pre-restore-$(date +%Y%m%d-%H%M%S).sql.gz"
    mkdir -p "$BACKUP_DIR"
    mysqldump --defaults-extra-file="$CNF" --single-transaction --no-tablespaces "$DB_NAME" | gzip > "$safety"
    ok "Current contents saved to $safety"

    gunzip -c "$FILE" | mysql --defaults-extra-file="$CNF" "$DB_NAME"
    ok "Restored from $FILE"
    exit 0
    ;;

# ---------------------------------------------------------------------------
""|--now)
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"

    stamp="$(date +%Y%m%d-%H%M%S)"
    target="${BACKUP_DIR}/amaso-${stamp}.sql.gz"

    # --single-transaction dumps a consistent snapshot without locking the
    # tables, so a backup running at 02:30 cannot block a late data entry.
    mysqldump --defaults-extra-file="$CNF" \
        --single-transaction \
        --no-tablespaces \
        --default-character-set=utf8mb4 \
        "$DB_NAME" | gzip > "$target"

    size="$(du -h "$target" | cut -f1)"

    # A dump that failed part-way still leaves a valid gzip file, so check
    # the tail of the SQL rather than the exit status alone.
    if ! gunzip -c "$target" | tail -5 | grep -q "Dump completed\|^);\|^/\*!"; then
        rm -f "$target"
        die "The dump looks truncated and was discarded. Is MariaDB running?"
    fi

    ok "$(date '+%Y-%m-%d %H:%M')  $target  ($size)"

    removed="$(find "$BACKUP_DIR" -name 'amaso-*.sql.gz' -type f -printf '%T@ %p\n' \
        | sort -rn | tail -n "+$((KEEP + 1))" | cut -d' ' -f2- | tee >(xargs -r rm -f) | wc -l)"
    [[ "$removed" -gt 0 ]] && ok "Removed $removed backup(s) older than the last $KEEP"
    exit 0
    ;;

*)
    die "Unknown option '$1'. Try --now, --list, --restore FILE or --install-cron."
    ;;
esac
