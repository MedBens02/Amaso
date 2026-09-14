#!/usr/bin/env bash
#
# Puts the current version of AMASO onto a server that provision.sh has
# already prepared, and brings it up. Run it again for every update.
#
#   sudo bash deploy.sh                                   # update in place
#   sudo bash deploy.sh https://github.com/you/Amaso.git  # first time
#
# What it does, in order: fetch the code, install dependencies, build the
# frontend, run the database migrations, clear and rebuild the caches,
# reload the web server. Nothing here touches the data.
#
# To deploy something other than the repository's default branch:
#   sudo BRANCH=some-branch bash deploy.sh

set -euo pipefail

HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=common.sh
source "$HERE/common.sh"

APP_USER="${APP_USER:-amaso}"
APP_DIR="${APP_DIR:-/var/www/amaso}"
DB_NAME="${DB_NAME:-amaso}"
DB_USER="${DB_USER:-amaso}"
BRANCH="${BRANCH:-}"
REPO_URL="${1:-}"

# Measured peak for `next build` on this application, plus room for the
# services already resident while it runs.
BUILD_NEED_MB="${BUILD_NEED_MB:-2400}"

as_app() { sudo -u "$APP_USER" -H "$@"; }

need_root
id "$APP_USER" >/dev/null 2>&1 || die "User '$APP_USER' does not exist - run provision.sh first."

# ---------------------------------------------------------------------------
# Which branch
#
# This used to default to "master" outright, which is wrong for any
# repository whose default is "main" and silently deploys the wrong thing
# for anyone working on a branch. Ask the repository what its default is.
# ---------------------------------------------------------------------------
if [[ -z "$BRANCH" ]]; then
    if [[ -d "$APP_DIR/.git" ]]; then
        as_app git -C "$APP_DIR" remote set-head origin --auto >/dev/null 2>&1 || true
        BRANCH="$(as_app git -C "$APP_DIR" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's|^origin/||')"
    elif [[ -n "$REPO_URL" ]]; then
        BRANCH="$(git ls-remote --symref "$REPO_URL" HEAD 2>/dev/null \
            | awk '/^ref:/ { sub("refs/heads/", "", $2); print $2; exit }')"
    fi
    [[ -n "$BRANCH" ]] || BRANCH="main"
    ok "Default branch: ${BRANCH}"
else
    warn "Deploying branch '${BRANCH}' (BRANCH was set explicitly)"
fi

# ---------------------------------------------------------------------------
# Code
# ---------------------------------------------------------------------------
if [[ ! -d "$APP_DIR/.git" ]]; then
    [[ -n "$REPO_URL" ]] || die "First run needs the repository URL:  sudo bash deploy.sh <git-url>"

    log "Cloning the repository"
    rm -rf "${APP_DIR:?}/"* "${APP_DIR:?}/".[!.]* 2>/dev/null || true
    as_app git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
    ok "Cloned $BRANCH"
else
    log "Fetching the latest version"
    as_app git -C "$APP_DIR" fetch --quiet origin "$BRANCH"

    previous="$(as_app git -C "$APP_DIR" rev-parse --short HEAD)"

    # A server checkout has no local work worth keeping, and a stray edit
    # would block the merge. Reset rather than pull.
    as_app git -C "$APP_DIR" reset --hard --quiet "origin/$BRANCH"

    current="$(as_app git -C "$APP_DIR" rev-parse --short HEAD)"
    if [[ "$previous" == "$current" ]]; then
        ok "Already at $current - rebuilding anyway"
    else
        ok "$previous -> $current"
    fi
fi

# ---------------------------------------------------------------------------
# Backend configuration
#
# .env is not in the repository, so it is created once and then left alone:
# regenerating it on every deploy would change APP_KEY and invalidate every
# session and encrypted value.
#
# The values are written with set_env rather than sed. Laravel's
# .env.example ships the database block commented out, and the seds this
# used to run could not match a commented line - so the file came out with
# DB_CONNECTION=mysql and no host, database, user or password at all, and
# the deploy died on the first migration against a database called
# "laravel" that does not exist. See common.sh.
# ---------------------------------------------------------------------------
env_file="$APP_DIR/backend/.env"

if [[ ! -f "$env_file" ]]; then
    log "Creating backend/.env"

    [[ -f /root/.amaso-db-password ]] || die "/root/.amaso-db-password is missing - re-run provision.sh"
    db_pass="$(cat /root/.amaso-db-password)"

    as_app cp "$APP_DIR/backend/.env.example" "$env_file"
    chmod 600 "$env_file"

    set_env "$env_file" APP_NAME        "AMASO"
    set_env "$env_file" APP_ENV         production
    set_env "$env_file" APP_DEBUG       false
    set_env "$env_file" APP_URL         "http://$(public_ip)"
    set_env "$env_file" LOG_LEVEL       warning

    set_env "$env_file" DB_CONNECTION   mysql
    set_env "$env_file" DB_HOST         127.0.0.1
    set_env "$env_file" DB_PORT         3306
    set_env "$env_file" DB_DATABASE     "$DB_NAME"
    set_env "$env_file" DB_USERNAME     "$DB_USER"
    set_env "$env_file" DB_PASSWORD     "$db_pass"

    set_env "$env_file" SESSION_DRIVER  database
    set_env "$env_file" CACHE_STORE     database

    # Nothing in this application dispatches a job, and there is no worker
    # process on this server. "database" would mean that if anything ever
    # did, it would sit in the jobs table and never run; "sync" makes it
    # run inline instead, which is slower but visible.
    set_env "$env_file" QUEUE_CONNECTION sync

    as_app php "$APP_DIR/backend/artisan" key:generate --force --quiet
    chown "$APP_USER:$APP_USER" "$env_file"
    chmod 600 "$env_file"
    ok "backend/.env written, application key generated"
else
    ok "backend/.env already present - left untouched"
fi

# Whatever wrote it, the file has to name a database. A .env that reaches
# migrate with these empty produces "Access denied for user 'root'", which
# points at everything except the real cause.
for key in DB_DATABASE DB_USERNAME DB_PASSWORD; do
    [[ -n "$(get_env "$env_file" "$key")" ]] \
        || die "$key is empty in backend/.env - delete the file and re-run this script to regenerate it"
done
ok "Database credentials present in backend/.env"

# ---------------------------------------------------------------------------
# PHP dependencies
# ---------------------------------------------------------------------------
log "Installing PHP dependencies"
as_app composer install \
    --working-dir="$APP_DIR/backend" \
    --no-dev --optimize-autoloader --no-interaction --quiet
ok "vendor/ up to date"

# Laravel writes compiled views and cached config into these at runtime;
# they carry only a .gitignore in the repository.
as_app mkdir -p \
    "$APP_DIR/backend/storage/framework/views" \
    "$APP_DIR/backend/storage/framework/cache/data" \
    "$APP_DIR/backend/storage/framework/sessions" \
    "$APP_DIR/backend/storage/logs" \
    "$APP_DIR/backend/bootstrap/cache"
chown -R "$APP_USER:$APP_USER" "$APP_DIR/backend/storage" "$APP_DIR/backend/bootstrap/cache"
chmod -R u+rwX "$APP_DIR/backend/storage" "$APP_DIR/backend/bootstrap/cache"
ok "Runtime directories in place"

# ---------------------------------------------------------------------------
# Database
#
# `migrate --force` applies new structure only. It never drops or rewrites
# existing rows, so it is safe against live records.
# ---------------------------------------------------------------------------
log "Applying database migrations"
as_app php "$APP_DIR/backend/artisan" migrate --force
ok "Schema up to date"

# Whether anyone can sign in yet, asked of the database rather than through
# artisan: a broken .env would make an artisan check fail in a way that
# looks like "no users" and reseed a populated database.
cnf="$(mktemp)"; chmod 600 "$cnf"
trap 'rm -f "$cnf"' EXIT
cat > "$cnf" <<CNF
[client]
user=$(get_env "$env_file" DB_USERNAME)
password=$(get_env "$env_file" DB_PASSWORD)
host=127.0.0.1
CNF

user_count="$(mysql --defaults-extra-file="$cnf" -N -B \
    -e "SELECT COUNT(*) FROM users" "$DB_NAME" 2>/dev/null || echo "error")"

if [[ "$user_count" == "error" ]]; then
    die "Could not read the users table with the credentials in backend/.env - check them against /root/.amaso-db-password"
elif [[ "$user_count" == "0" ]]; then
    warn "No user accounts found - seeding the reference data and the initial accounts"
    # DatabaseSeeder only: reference data and the three staff accounts.
    # DemoDataSeeder, which invents families and money, is never run here.
    as_app php "$APP_DIR/backend/artisan" db:seed --force
    warn "Sign in as admin@amaso.org / password, then change it immediately"
else
    ok "${user_count} user account(s) already present - not seeding"
fi

# ---------------------------------------------------------------------------
# Frontend
#
# Built as a static export: nginx serves the files and proxies /api, so
# the browser talks to one origin and no Node process runs in production.
# ---------------------------------------------------------------------------
log "Building the frontend"

# The single largest thing this server ever does. Measured at 1.34 GB peak
# resident for this application, which is more than a 1 GB VPS has - and an
# OOM kill during `next build` reports itself as the word "Killed" and
# nothing else, with frontend/out left missing. Checked here so the reason
# is named before the build rather than guessed at afterwards.
mem_total=$(( $(ram_mb) + $(swap_mb) ))
if (( mem_total < BUILD_NEED_MB )); then
    die "$(cat <<MSG
Only ${mem_total} MB of RAM + swap; the frontend build peaks near 1.4 GB
    and will be killed part way through.

    Add swap and try again:
        sudo fallocate -l 3G /swapfile && sudo chmod 600 /swapfile
        sudo mkswap /swapfile && sudo swapon /swapfile
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    (provision.sh does this for you - re-running it is the easier route.)
MSG
)"
fi
ok "${mem_total} MB of RAM + swap available for a build that needs about 1.4 GB"

as_app npm --prefix "$APP_DIR/frontend" ci --no-audit --no-fund --silent \
    || as_app npm --prefix "$APP_DIR/frontend" install --no-audit --no-fund --silent

# Relative, so the pages work under whatever hostname or IP answers -
# no rebuild needed when a domain is added later.
as_app tee "$APP_DIR/frontend/.env.production" >/dev/null <<'ENVEOF'
NEXT_PUBLIC_API_BASE_URL=/api/v1
NEXT_TELEMETRY_DISABLED=1
ENVEOF

# Giving V8 a ceiling makes it collect garbage as it approaches one rather
# than growing until the kernel intervenes. Three fifths of what the
# machine has, so the rest stays available to MariaDB and PHP-FPM.
heap_mb=$(( mem_total * 60 / 100 ))
(( heap_mb > 4096 )) && heap_mb=4096
(( heap_mb < 1536 )) && heap_mb=1536

as_app env BUILD_STATIC=1 \
    NODE_OPTIONS="--max-old-space-size=${heap_mb}" \
    npm --prefix "$APP_DIR/frontend" run build

[[ -f "$APP_DIR/frontend/out/index.html" ]] || die "The build produced no out/index.html"
ok "Static export written to frontend/out ($(du -sh "$APP_DIR/frontend/out" | cut -f1))"

# ---------------------------------------------------------------------------
# Caches
#
# Rebuilt last, after the code that they compile is in place. Clearing
# first matters on an update: a cached config still holding the previous
# release's values outlives the deploy otherwise.
# ---------------------------------------------------------------------------
log "Rebuilding the caches"
as_app php "$APP_DIR/backend/artisan" config:clear --quiet
as_app php "$APP_DIR/backend/artisan" cache:clear --quiet || true
as_app php "$APP_DIR/backend/artisan" view:clear --quiet
as_app php "$APP_DIR/backend/artisan" config:cache --quiet
as_app php "$APP_DIR/backend/artisan" route:cache --quiet
as_app php "$APP_DIR/backend/artisan" view:cache --quiet
ok "Configuration, routes and views cached"

# ---------------------------------------------------------------------------
# Restart
# ---------------------------------------------------------------------------
log "Restarting the services"
# This reload is not housekeeping: provision.sh sets
# opcache.validate_timestamps=0, so PHP never checks whether the source
# changed. The graceful reload replaces the workers, and with them the
# compiled code they were holding. Skip it and the server keeps serving the
# previous release from memory.
unit="$(php_fpm_unit)"
if [[ -n "$unit" ]]; then
    systemctl reload "$unit"
    ok "$unit reloaded (new code picked up)"
else
    warn "No php-fpm unit found - the API may still be serving the previous release"
fi

nginx -t >/dev/null 2>&1 || die "The nginx configuration is invalid - run 'nginx -t' to see why"
systemctl reload nginx
ok "nginx reloaded"

# ---------------------------------------------------------------------------
# Check that it actually answers
# ---------------------------------------------------------------------------
log "Verifying"
sleep 2

# curl prints "000" itself when it cannot connect and also exits non-zero,
# so a `|| echo 000` fallback would report "000000".
http_code() {
    local code
    code="$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$1" 2>/dev/null)" || true
    printf '%s' "${code:-000}"
}

page_status="$(http_code http://127.0.0.1/)"
api_status="$(http_code http://127.0.0.1/api/v1/widows)"

# 401 is the right answer for the API: it means Laravel handled the request
# and asked for a token. A 200 there would mean the route is unprotected.
[[ "$page_status" == "200" ]] && ok "Frontend answers (HTTP $page_status)" \
                             || warn "Frontend returned HTTP $page_status - see /var/log/nginx/amaso-error.log"
[[ "$api_status" == "401" ]] && ok "API answers and requires authentication (HTTP $api_status)" \
                            || warn "API returned HTTP $api_status - expected 401; see /var/log/php-fpm-amaso.log"

app_url="$(get_env "$env_file" APP_URL)"
printf '\n%s    Deployed. The application is at  %s%s\n\n' "$C_GOOD" "${app_url:-http://$(public_ip)}" "$C_OFF"
