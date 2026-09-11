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

set -euo pipefail

APP_USER="${APP_USER:-amaso}"
APP_DIR="${APP_DIR:-/var/www/amaso}"
BRANCH="${BRANCH:-master}"
DB_NAME="${DB_NAME:-amaso}"
DB_USER="${DB_USER:-amaso}"
REPO_URL="${1:-}"

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[0;32m[ok]\033[0m %s\n' "$*"; }
warn() { printf '    \033[0;33m[!]\033[0m %s\n' "$*"; }
die()  { printf '\n\033[0;31m[x] %s\033[0m\n\n' "$*" >&2; exit 1; }

as_app() { sudo -u "$APP_USER" -H "$@"; }

[[ $EUID -eq 0 ]] || die "Run this as root:  sudo bash deploy.sh"
id "$APP_USER" >/dev/null 2>&1 || die "User '$APP_USER' does not exist - run provision.sh first."

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
# ---------------------------------------------------------------------------
if [[ ! -f "$APP_DIR/backend/.env" ]]; then
    log "Creating backend/.env"

    [[ -f /root/.amaso-db-password ]] || die "/root/.amaso-db-password is missing - re-run provision.sh"
    db_pass="$(cat /root/.amaso-db-password)"

    as_app cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
    as_app sed -i \
        -e "s|^APP_ENV=.*|APP_ENV=production|" \
        -e "s|^APP_DEBUG=.*|APP_DEBUG=false|" \
        -e "s|^DB_CONNECTION=.*|DB_CONNECTION=mysql|" \
        -e "s|^DB_HOST=.*|DB_HOST=127.0.0.1|" \
        -e "s|^DB_PORT=.*|DB_PORT=3306|" \
        -e "s|^DB_DATABASE=.*|DB_DATABASE=${DB_NAME}|" \
        -e "s|^DB_USERNAME=.*|DB_USERNAME=${DB_USER}|" \
        -e "s|^DB_PASSWORD=.*|DB_PASSWORD=${db_pass}|" \
        "$APP_DIR/backend/.env"

    as_app php "$APP_DIR/backend/artisan" key:generate --force --quiet
    chmod 600 "$APP_DIR/backend/.env"
    ok "backend/.env written, application key generated"
else
    ok "backend/.env already present - left untouched"
fi

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

if ! as_app php "$APP_DIR/backend/artisan" tinker --execute="echo \App\Models\User::count();" 2>/dev/null | grep -qE '^[1-9]'; then
    warn "No user accounts found - seeding the reference data and the initial accounts"
    as_app php "$APP_DIR/backend/artisan" db:seed --force
    warn "Sign in as admin@amaso.org / password, then change it immediately"
fi

# ---------------------------------------------------------------------------
# Frontend
#
# Built as a static export: nginx serves the files and proxies /api, so
# the browser talks to one origin and no Node process runs in production.
# ---------------------------------------------------------------------------
log "Building the frontend"

as_app npm --prefix "$APP_DIR/frontend" ci --no-audit --no-fund --silent \
    || as_app npm --prefix "$APP_DIR/frontend" install --no-audit --no-fund --silent

# Relative, so the pages work under whatever hostname or IP answers -
# no rebuild needed when a domain is added later.
as_app tee "$APP_DIR/frontend/.env.production" >/dev/null <<'ENVEOF'
NEXT_PUBLIC_API_BASE_URL=/api/v1
NEXT_TELEMETRY_DISABLED=1
ENVEOF

as_app env BUILD_STATIC=1 npm --prefix "$APP_DIR/frontend" run build

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
php_fpm_unit="$(systemctl list-units --type=service --plain --no-legend 'php*-fpm.service' | awk '{print $1}' | head -1)"
[[ -n "$php_fpm_unit" ]] && systemctl reload "$php_fpm_unit" && ok "$php_fpm_unit reloaded (new code picked up)"

nginx -t >/dev/null 2>&1 || die "The nginx configuration is invalid - run 'nginx -t' to see why"
systemctl reload nginx
ok "nginx reloaded"

# ---------------------------------------------------------------------------
# Check that it actually answers
# ---------------------------------------------------------------------------
log "Verifying"
sleep 2

page_status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/ || echo 000)"
api_status="$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1/api/v1/widows || echo 000)"

# 401 is the right answer for the API: it means Laravel handled the request
# and asked for a token. A 200 there would mean the route is unprotected.
[[ "$page_status" == "200" ]] && ok "Frontend answers (HTTP $page_status)" \
                             || warn "Frontend returned HTTP $page_status - see /var/log/nginx/amaso-error.log"
[[ "$api_status" == "401" ]] && ok "API answers and requires authentication (HTTP $api_status)" \
                            || warn "API returned HTTP $api_status - expected 401; see /var/log/php-fpm-amaso.log"

ip="$(curl -s --max-time 4 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
printf '\n\033[1;32m    Deployed. The application is at  http://%s\033[0m\n\n' "$ip"
