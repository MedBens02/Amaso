#!/usr/bin/env bash
#
# Backs up the AMASO database.
#
#   sudo bash backup.sh                 take a backup now
#   sudo bash backup.sh --install-cron  take one nightly at 02:30
#   sudo bash backup.sh --list          show what is stored
#   sudo bash backup.sh --restore FILE  put a backup back
#   sudo bash backup.sh --to-cloud      also copy it off the server
#   sudo bash backup.sh --setup-cloud   install the oci command (once)
#   sudo bash backup.sh --list-cloud    show what is in the bucket
#   sudo bash backup.sh --fetch NAME    download one from the bucket
#
# Backups are gzipped SQL, written to /var/backups/amaso, and the last 30
# are kept. The whole database is a few megabytes, so a full dump every
# night costs almost nothing and restores in one command - which is worth
# more here than anything cleverer.
#
# A copy that lives on the same machine as the database protects against a
# mistake, not against losing the machine. --to-cloud sends the same file to
# an object store as well, so the records survive the disk that held them.
# On Oracle Cloud that is a free bucket; see deploy/OCI.md.

set -euo pipefail

HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=common.sh
source "$HERE/common.sh"

DB_NAME="${DB_NAME:-amaso}"
DB_USER="${DB_USER:-amaso}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/amaso}"
KEEP="${KEEP:-30}"
# Where the off-server copy goes. Set OCI_BUCKET (and optionally
# OCI_NAMESPACE, which is looked up when it is not given) to switch it on.
OCI_BUCKET="${OCI_BUCKET:-}"
OCI_NAMESPACE="${OCI_NAMESPACE:-}"
# How the oci command proves who it is. "instance_principal" means the
# server itself is authorised, through a dynamic group and a policy, so no
# API key or private key is stored on the machine that holds the families'
# records - the one place a stolen key would hurt most. Set OCI_AUTH to
# anything else (e.g. "api_key") to use ~/.oci/config instead.
OCI_AUTH="${OCI_AUTH:-instance_principal}"
PASS_FILE="${PASS_FILE:-/root/.amaso-db-password}"

# common.sh drops the colour codes when stdout is not a terminal, which
# matters here more than anywhere else: this runs nightly from cron into
# /var/log/amaso-backup.log, and escape sequences in a log file make it
# unreadable in exactly the situation you would be reading it.

# ---------------------------------------------------------------------------
# The off-server copy
#
# Deliberately best-effort: a bucket that is full, renamed or unreachable
# must not fail the backup that already succeeded on disk. It says what
# happened and returns non-zero, and the caller decides.
# ---------------------------------------------------------------------------
# The oci command, and how it proves who it is. Collected here so the
# upload, the listing and the download cannot drift apart.
OCI_ARGS=()
oci_ready() {
    command -v oci >/dev/null || {
        warn "The oci command is not installed - run:  sudo bash $0 --setup-cloud"
        return 1
    }
    OCI_ARGS=(--auth "$OCI_AUTH")
    [[ "$OCI_AUTH" == "api_key" ]] && OCI_ARGS=()

    if [[ -z "$OCI_NAMESPACE" ]]; then
        OCI_NAMESPACE="$(oci "${OCI_ARGS[@]}" os ns get --query 'data' --raw-output 2>/dev/null || true)"
    fi
    [[ -n "$OCI_NAMESPACE" ]] || {
        warn "Could not read the Object Storage namespace - the dynamic group or policy"
        warn "in deploy/OCI.md §9 is missing, or was created less than a minute ago."
        return 1
    }
}

upload_to_cloud() {
    local file="$1" err

    [[ -n "$OCI_BUCKET" ]] || { warn "No OCI_BUCKET set - keeping the backup on this server only"; return 1; }
    oci_ready || return 1

    # The file name carries the date and time, so an object of that name
    # never exists yet: --force only skips a confirmation prompt, it never
    # overwrites - and the policy in OCI.md would refuse an overwrite anyway.
    if err="$(oci "${OCI_ARGS[@]}" os object put \
            --namespace "$OCI_NAMESPACE" \
            --bucket-name "$OCI_BUCKET" \
            --file "$file" \
            --name "$(basename "$file")" \
            --force 2>&1 >/dev/null)"; then
        ok "Copied off the server to ${OCI_BUCKET}/$(basename "$file")"
        return 0
    fi

    # Oracle's own message names the cause - a missing policy, a wrong
    # bucket name - where a bare "failed" sends you guessing.
    warn "Could not upload to ${OCI_BUCKET} - the backup is still on this server"
    printf '%s\n' "$err" | grep -E '"(code|message)"' | head -2 | sed 's/^ */        /' || true
    return 1
}

need_root

# ---------------------------------------------------------------------------
# The cloud commands need no database, so they are answered before the
# database password is read.
# ---------------------------------------------------------------------------
case "${1:-}" in
--setup-cloud)
    # Ubuntu does not package the oci command. Oracle's install script puts
    # it under root's home, outside the PATH cron runs with, so the nightly
    # job would never find it. A virtualenv under /opt with a link in
    # /usr/local/bin is found by both.
    if ! command -v oci >/dev/null; then
        log "Installing the oci command into /opt/oci-cli"
        DEBIAN_FRONTEND=noninteractive apt-get install -y -qq python3-venv >/dev/null
        python3 -m venv /opt/oci-cli
        /opt/oci-cli/bin/pip install -q --disable-pip-version-check oci-cli
        ln -sf /opt/oci-cli/bin/oci /usr/local/bin/oci
    fi
    ok "$(oci --version 2>/dev/null | head -1 | sed 's/^/oci /')"

    # Proven the way the nightly job will use it: by this server, with no
    # key, reaching the bucket - not merely by the command existing.
    [[ -n "$OCI_BUCKET" ]] || die "Say which bucket:  sudo OCI_BUCKET=amaso-backups bash $0 --setup-cloud"
    oci_ready || exit 1
    if oci "${OCI_ARGS[@]}" os object list --namespace "$OCI_NAMESPACE" --bucket-name "$OCI_BUCKET" \
            --limit 1 >/dev/null 2>&1; then
        ok "This server reaches the bucket ${OCI_BUCKET} by itself (namespace ${OCI_NAMESPACE})"
        printf '\n    Next:  sudo OCI_BUCKET=%s OCI_NAMESPACE=%s bash %s --to-cloud\n\n' \
            "$OCI_BUCKET" "$OCI_NAMESPACE" "$0"
    else
        warn "Installed, but this server cannot reach the bucket ${OCI_BUCKET} yet."
        warn "Check the bucket name, the dynamic group and the policy in deploy/OCI.md §9;"
        warn "a new policy can take a minute or two to apply."
        exit 1
    fi
    exit 0
    ;;

--list-cloud)
    [[ -n "$OCI_BUCKET" ]] || die "Say which bucket:  sudo OCI_BUCKET=amaso-backups bash $0 --list-cloud"
    oci_ready || exit 1
    oci "${OCI_ARGS[@]}" os object list --namespace "$OCI_NAMESPACE" --bucket-name "$OCI_BUCKET" \
        --all --query 'data[].[name, size, "time-created"]' --output table
    exit 0
    ;;

--fetch)
    name="${2:-}"
    [[ -n "$name" && -n "$OCI_BUCKET" ]] \
        || die "Usage: sudo OCI_BUCKET=amaso-backups bash $0 --fetch amaso-<date>.sql.gz"
    [[ "$name" == */* ]] && die "Give the object name only, as --list-cloud shows it."
    oci_ready || exit 1
    mkdir -p "$BACKUP_DIR" && chmod 700 "$BACKUP_DIR"
    # Saved as fetched-*, outside the amaso-* pattern, so an old backup
    # brought down today is not taken for tonight's by --list, status.sh
    # or the rotation that keeps the last 30.
    local_copy="$BACKUP_DIR/fetched-$name"
    oci "${OCI_ARGS[@]}" os object get --namespace "$OCI_NAMESPACE" --bucket-name "$OCI_BUCKET" \
        --name "$name" --file "$local_copy" >/dev/null
    ok "Downloaded to $local_copy"
    printf '\n    To put it back:  sudo bash %s --restore %s\n\n' "$0" "$local_copy"
    exit 0
    ;;
esac

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

    # cron runs with almost no environment, so a bucket set in the shell
    # that installed this would not reach the nightly run - the backup
    # would quietly stay on the server. Bake it into the crontab instead.
    cron_env=""
    if [[ -n "$OCI_BUCKET" ]]; then
        cron_env="OCI_BUCKET=${OCI_BUCKET}"
        [[ -n "$OCI_NAMESPACE" ]] && cron_env+=$'\n'"OCI_NAMESPACE=${OCI_NAMESPACE}"
        cron_env+=$'\n'"OCI_AUTH=${OCI_AUTH}"
    fi

    cat > /etc/cron.d/amaso-backup <<CRONEOF
# Nightly AMASO database backup. Output goes to the system log.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
${cron_env}
30 2 * * * root ${script_path} >> /var/log/amaso-backup.log 2>&1
CRONEOF
    chmod 644 /etc/cron.d/amaso-backup
    ok "Nightly backup scheduled for 02:30, logging to /var/log/amaso-backup.log"
    if [[ -n "$OCI_BUCKET" ]]; then
        ok "Each backup will also be copied to the bucket ${OCI_BUCKET}"
    else
        warn "Backups will stay on this server only. To copy them off as well:"
        warn "  sudo OCI_BUCKET=<bucket> bash backup.sh --install-cron"
    fi
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

    printf '\n%s  This replaces every row in "%s" with the contents of\n' "$C_WARN" "$DB_NAME"
    printf '  %s. Anything entered since that backup is lost.%s\n\n' "$FILE" "$C_OFF"
    read -r -p "  Type the database name to confirm: " answer
    [[ "$answer" == "$DB_NAME" ]] || die "Not confirmed - nothing was changed."

    # Take a copy of what is there now first. A restore is usually done in
    # a hurry, and "the backup was the wrong one" is a bad place to end up.
    safety="${BACKUP_DIR}/pre-restore-$(date +%Y%m%d-%H%M%S).sql.gz"
    mkdir -p "$BACKUP_DIR"
    if ! mysqldump --defaults-extra-file="$CNF" --single-transaction --no-tablespaces "$DB_NAME" \
            | gzip > "$safety"; then
        rm -f "$safety"
        die "Could not save the current contents first - nothing was restored."
    fi
    ok "Current contents saved to $safety"

    gunzip -c "$FILE" | mysql --defaults-extra-file="$CNF" "$DB_NAME"
    ok "Restored from $FILE"
    exit 0
    ;;

# ---------------------------------------------------------------------------
""|--now|--to-cloud)
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"

    stamp="$(date +%Y%m%d-%H%M%S)"
    target="${BACKUP_DIR}/amaso-${stamp}.sql.gz"

    # --single-transaction dumps a consistent snapshot without locking the
    # tables, so a backup running at 02:30 cannot block a late data entry.
    #
    # Written under a .part name and renamed only once it checks out: a
    # dump that dies half way must not leave a file that looks like last
    # night's backup to --list, to status.sh and to whoever restores from it.
    if ! mysqldump --defaults-extra-file="$CNF" \
            --single-transaction \
            --no-tablespaces \
            --default-character-set=utf8mb4 \
            "$DB_NAME" | gzip > "${target}.part"; then
        rm -f "${target}.part"
        die "The database dump failed - nothing was saved. Is MariaDB running?"
    fi

    # A dump cut short can still be a valid gzip file, so check the tail of
    # the SQL rather than the exit status alone.
    if ! gunzip -c "${target}.part" | tail -5 | grep -q "Dump completed\|^);\|^/\*!"; then
        rm -f "${target}.part"
        die "The dump looks truncated and was discarded. Is MariaDB running?"
    fi
    mv "${target}.part" "$target"

    size="$(du -h "$target" | cut -f1)"

    ok "$(date '+%Y-%m-%d %H:%M')  $target  ($size)"

    removed="$(find "$BACKUP_DIR" -name 'amaso-*.sql.gz' -type f -printf '%T@ %p\n' \
        | sort -rn | tail -n "+$((KEEP + 1))" | cut -d' ' -f2- | tee >(xargs -r rm -f) | wc -l)"
    [[ "$removed" -gt 0 ]] && ok "Removed $removed backup(s) older than the last $KEEP"

    # Asked for explicitly, or whenever a bucket is configured - so the
    # nightly cron job copies off the server without needing its own flag.
    # Asked for by hand, a failed upload is an error you should see; from
    # the nightly job it is a warning in the log, and the backup on disk
    # still counts.
    if [[ "${1:-}" == "--to-cloud" || -n "$OCI_BUCKET" ]]; then
        if ! upload_to_cloud "$target" && [[ "${1:-}" == "--to-cloud" ]]; then
            exit 1
        fi
    fi
    exit 0
    ;;

*)
    die "Unknown option '$1'. Try --now, --to-cloud, --list, --restore FILE, --install-cron, --setup-cloud, --list-cloud or --fetch NAME."
    ;;
esac
