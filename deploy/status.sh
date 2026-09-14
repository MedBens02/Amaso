#!/usr/bin/env bash
#
# What is this server doing, and is any of it wrong?
#
#   sudo bash status.sh
#
# Read-only. Run it when something looks off, or once in a while to check
# that the backups are still happening and the certificate is still good.

set -uo pipefail   # deliberately not -e: a failing check is a result, not a crash

HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=common.sh
source "$HERE/common.sh"

APP_USER="${APP_USER:-amaso}"
APP_DIR="${APP_DIR:-/var/www/amaso}"
DB_NAME="${DB_NAME:-amaso}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/amaso}"

problems=0
row()  { printf '    %-22s %s\n' "$1" "$2"; }
good() { printf '    %-22s %s%s%s\n' "$1" "$C_OK" "$2" "$C_OFF"; }
bad()  { printf '    %-22s %s%s%s\n' "$1" "$C_ERR" "$2" "$C_OFF"; problems=$(( problems + 1 )); }
meh()  { printf '    %-22s %s%s%s\n' "$1" "$C_WARN" "$2" "$C_OFF"; }

# ---------------------------------------------------------------------------
log "Services"

for svc in nginx mariadb fail2ban; do
    if systemctl is-active --quiet "$svc" 2>/dev/null; then
        good "$svc" "running"
    elif systemctl list-unit-files 2>/dev/null | grep -q "^${svc}"; then
        bad "$svc" "NOT running   (systemctl status $svc)"
    else
        meh "$svc" "not installed"
    fi
done

unit="$(php_fpm_unit)"
if [[ -n "$unit" ]] && systemctl is-active --quiet "$unit"; then
    good "${unit%.service}" "running"
else
    bad "php-fpm" "NOT running"
fi

if [[ -S /run/php/php-fpm-amaso.sock ]]; then
    good "amaso pool socket" "/run/php/php-fpm-amaso.sock"
else
    bad "amaso pool socket" "missing - the API cannot be reached"
fi

# ---------------------------------------------------------------------------
log "The application"

if [[ -d "$APP_DIR/.git" ]]; then
    branch="$(sudo -u "$APP_USER" -H git -C "$APP_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)"
    commit="$(sudo -u "$APP_USER" -H git -C "$APP_DIR" log -1 --format='%h  %cd  %s' --date=short 2>/dev/null)"
    row "branch" "$branch"
    row "version" "${commit:0:70}"
else
    bad "code" "$APP_DIR is not a git checkout - deploy.sh has not run"
fi

if [[ -f "$APP_DIR/frontend/out/index.html" ]]; then
    good "frontend build" "$(du -sh "$APP_DIR/frontend/out" 2>/dev/null | cut -f1) in frontend/out"
else
    bad "frontend build" "frontend/out/index.html missing - the build did not finish"
fi

env_file="$APP_DIR/backend/.env"
if [[ -f "$env_file" ]]; then
    missing=""
    for key in APP_KEY DB_DATABASE DB_USERNAME DB_PASSWORD; do
        [[ -n "$(get_env "$env_file" "$key")" ]] || missing+="$key "
    done
    if [[ -n "$missing" ]]; then
        bad "backend/.env" "empty: $missing"
    else
        good "backend/.env" "complete ($(get_env "$env_file" APP_ENV), debug=$(get_env "$env_file" APP_DEBUG))"
    fi
    row "APP_URL" "$(get_env "$env_file" APP_URL)"
else
    bad "backend/.env" "missing"
fi

# ---------------------------------------------------------------------------
log "Answering"

# curl prints "000" of its own accord when it cannot connect, and also
# exits non-zero - so `|| echo 000` appended a second copy and the status
# read "HTTP 000000". Default only when nothing came back at all.
http_code() {
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null)" || true
    printf '%s' "${code:-000}"
}

page="$(http_code http://127.0.0.1/)"
api="$(http_code http://127.0.0.1/api/v1/widows)"

[[ "$page" == "200" ]] && good "frontend" "HTTP $page" || bad "frontend" "HTTP $page  (/var/log/nginx/amaso-error.log)"
# 401 means Laravel handled it and asked for a token, which is correct.
[[ "$api" == "401" ]] && good "API" "HTTP $api (authentication required)" \
                      || bad "API" "HTTP $api, expected 401  (/var/log/php-fpm-amaso.log)"

# ---------------------------------------------------------------------------
log "Database"

if [[ -f /root/.amaso-db-password ]]; then
    cnf="$(mktemp)"; chmod 600 "$cnf"
    trap 'rm -f "$cnf"' EXIT
    printf '[client]\nuser=%s\npassword=%s\nhost=127.0.0.1\n' \
        "${DB_USER:-amaso}" "$(cat /root/.amaso-db-password)" > "$cnf"

    if counts="$(mysql --defaults-extra-file="$cnf" -N -B "$DB_NAME" 2>/dev/null -e "
        SELECT (SELECT COUNT(*) FROM users),
               (SELECT COUNT(*) FROM widows),
               (SELECT COUNT(*) FROM orphans),
               (SELECT COUNT(*) FROM incomes),
               (SELECT COUNT(*) FROM expenses);")"; then
        read -r u w o i e <<< "$counts"
        good "connection" "ok"
        row "rows" "$u users, $w families, $o orphans, $i incomes, $e expenses"
        size="$(mysql --defaults-extra-file="$cnf" -N -B -e "
            SELECT ROUND(SUM(data_length + index_length)/1024/1024, 1)
            FROM information_schema.TABLES WHERE table_schema='${DB_NAME}';" 2>/dev/null)"
        row "size" "${size:-?} MB"
    else
        bad "connection" "cannot query ${DB_NAME} with the stored password"
    fi
else
    bad "password file" "/root/.amaso-db-password is missing"
fi

# ---------------------------------------------------------------------------
log "Backups"

if [[ -f /etc/cron.d/amaso-backup ]]; then
    good "schedule" "nightly (/etc/cron.d/amaso-backup)"
else
    bad "schedule" "not scheduled - run: sudo bash $HERE/backup.sh --install-cron"
fi

latest="$(find "$BACKUP_DIR" -name 'amaso-*.sql.gz' -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -1)"
if [[ -n "$latest" ]]; then
    file="${latest#* }"
    age_h=$(( ( $(date +%s) - ${latest%%.*} ) / 3600 ))
    count="$(find "$BACKUP_DIR" -name 'amaso-*.sql.gz' -type f 2>/dev/null | wc -l)"
    if (( age_h <= 48 )); then
        good "most recent" "$(basename "$file")  (${age_h}h ago, ${count} kept)"
    else
        bad "most recent" "$(basename "$file")  (${age_h}h ago - the nightly job may be failing)"
    fi
else
    bad "most recent" "no backups in $BACKUP_DIR"
fi

# ---------------------------------------------------------------------------
log "HTTPS"

cert="$(find /etc/letsencrypt/live -name fullchain.pem 2>/dev/null | head -1)"
if [[ -n "$cert" ]]; then
    expires="$(openssl x509 -enddate -noout -in "$cert" 2>/dev/null | cut -d= -f2)"
    days=$(( ( $(date -d "$expires" +%s) - $(date +%s) ) / 86400 ))
    names="$(openssl x509 -noout -text -in "$cert" 2>/dev/null \
        | awk '/DNS:/{gsub(/ *DNS:/,""); print; exit}')"
    if (( days > 14 )); then
        good "certificate" "${days} days left  (${names})"
    else
        bad "certificate" "expires in ${days} days - check 'systemctl list-timers | grep certbot'"
    fi
else
    meh "certificate" "none - the site is plain HTTP"
fi

# ---------------------------------------------------------------------------
log "Resources"

ram="$(ram_mb)"; swap="$(swap_mb)"
avail="$(awk '/^MemAvailable:/ {print int($2/1024)}' /proc/meminfo)"
row "memory" "${ram} MB RAM (${avail} MB available), ${swap} MB swap"

# The build is what needs the headroom; the running site does not.
if (( ram + swap < 2400 )); then
    bad "build headroom" "$(( ram + swap )) MB total - the next deploy's frontend build will be OOM-killed"
fi

disk_free="$(df -Pm / | awk 'NR==2 {print $4}')"
disk_pct="$(df -P / | awk 'NR==2 {gsub(/%/,""); print $5}')"
if (( disk_pct < 85 )); then
    row "disk" "${disk_free} MB free (${disk_pct}% used)"
else
    bad "disk" "${disk_free} MB free (${disk_pct}% used) - MariaDB stops accepting writes when this fills"
fi

row "uptime" "$(uptime -p 2>/dev/null | sed 's/^up //')"

# ---------------------------------------------------------------------------
log "Recent errors"

if [[ -s /var/log/php-fpm-amaso.log ]]; then
    n="$(grep -c . /var/log/php-fpm-amaso.log 2>/dev/null || echo 0)"
    row "php-fpm log" "${n} line(s); last:"
    tail -3 /var/log/php-fpm-amaso.log 2>/dev/null | sed 's/^/      /'
else
    good "php-fpm log" "empty"
fi

laravel_log="$APP_DIR/backend/storage/logs/laravel.log"
if [[ -s "$laravel_log" ]]; then
    today="$(grep -c "$(date +%Y-%m-%d)" "$laravel_log" 2>/dev/null || echo 0)"
    if (( today > 0 )); then
        meh "laravel log" "${today} entries today; last:"
        tail -3 "$laravel_log" 2>/dev/null | cut -c1-120 | sed 's/^/      /'
    else
        good "laravel log" "nothing today"
    fi
else
    good "laravel log" "empty"
fi

# ---------------------------------------------------------------------------
printf '\n'
if (( problems == 0 )); then
    printf '%s    Everything checks out.%s\n\n' "$C_GOOD" "$C_OFF"
else
    printf '%s    %d problem(s) above.%s\n\n' "$C_ERR" "$problems" "$C_OFF"
fi
exit $(( problems > 0 ))
