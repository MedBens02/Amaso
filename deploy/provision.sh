#!/usr/bin/env bash
#
# Prepares a fresh Ubuntu server to run AMASO. Run once, as root, on a
# newly created VM. It is safe to re-run: every step checks its own state
# first.
#
#   sudo bash provision.sh
#
# Installs nginx, PHP-FPM, MariaDB, Node and Composer, creates the
# database and its user, writes the site configuration and opens the
# firewall. It does not fetch the application - deploy.sh does that.
#
# Tested against Ubuntu 22.04 and 24.04.

set -euo pipefail

APP_USER="${APP_USER:-amaso}"
APP_DIR="${APP_DIR:-/var/www/amaso}"
DB_NAME="${DB_NAME:-amaso}"
DB_USER="${DB_USER:-amaso}"
SERVER_NAME="${SERVER_NAME:-_}"
PHP_VERSION="${PHP_VERSION:-}"

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[0;32m[ok]\033[0m %s\n' "$*"; }
warn() { printf '    \033[0;33m[!]\033[0m %s\n' "$*"; }
die()  { printf '\n\033[0;31m[x] %s\033[0m\n\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root:  sudo bash provision.sh"
command -v apt-get >/dev/null || die "This script targets Debian/Ubuntu (apt-get not found)."

# ---------------------------------------------------------------------------
# Packages
#
# Ubuntu 24.04 ships PHP 8.3; 22.04 only 8.1, which is below what the
# application needs, so the ondrej PPA is added there and nowhere else.
# ---------------------------------------------------------------------------
log "Installing packages"

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

if [[ -z "$PHP_VERSION" ]]; then
    ubuntu_version="$(. /etc/os-release && echo "${VERSION_ID:-}")"
    case "$ubuntu_version" in
        24.*|25.*) PHP_VERSION="8.3" ;;
        *)
            warn "Ubuntu ${ubuntu_version:-unknown} ships PHP 8.1 or older; adding the ondrej/php PPA"
            apt-get install -y -qq software-properties-common
            add-apt-repository -y ppa:ondrej/php >/dev/null
            apt-get update -qq
            PHP_VERSION="8.3"
            ;;
    esac
fi
ok "Targeting PHP ${PHP_VERSION}"

# gd is not optional: without it every .xlsx export fails at runtime.
apt-get install -y -qq \
    nginx mariadb-server curl git unzip rsync \
    "php${PHP_VERSION}-fpm" \
    "php${PHP_VERSION}-mysql" \
    "php${PHP_VERSION}-mbstring" \
    "php${PHP_VERSION}-xml" \
    "php${PHP_VERSION}-curl" \
    "php${PHP_VERSION}-zip" \
    "php${PHP_VERSION}-gd" \
    "php${PHP_VERSION}-bcmath" \
    "php${PHP_VERSION}-intl"
ok "nginx, MariaDB and PHP ${PHP_VERSION} installed"

if ! command -v node >/dev/null || [[ "$(node -v | cut -c2- | cut -d. -f1)" -lt 20 ]]; then
    log "Installing Node.js 20"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - >/dev/null
    apt-get install -y -qq nodejs
fi
ok "Node $(node -v)"

if ! command -v composer >/dev/null; then
    log "Installing Composer"
    curl -fsSL https://getcomposer.org/installer -o /tmp/composer-setup.php
    php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer --quiet
    rm -f /tmp/composer-setup.php
fi
ok "Composer $(composer --version --no-ansi 2>/dev/null | head -1)"

# ---------------------------------------------------------------------------
# Application user and directory
#
# The application runs as its own unprivileged user rather than as
# www-data, so a compromise of any other site on the box does not reach
# the association's records.
# ---------------------------------------------------------------------------
log "Creating the application user and directory"

if ! id "$APP_USER" >/dev/null 2>&1; then
    adduser --system --group --home "$APP_DIR" --shell /usr/sbin/nologin "$APP_USER"
fi
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
ok "$APP_USER owns $APP_DIR"

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
log "Creating the database"

if [[ -f /root/.amaso-db-password ]]; then
    DB_PASS="$(cat /root/.amaso-db-password)"
    ok "Reusing the database password from /root/.amaso-db-password"
else
    DB_PASS="$(head -c 24 /dev/urandom | base64 | tr -d '/+=' | head -c 24)"
    printf '%s' "$DB_PASS" > /root/.amaso-db-password
    chmod 600 /root/.amaso-db-password
    ok "Generated a database password, saved to /root/.amaso-db-password"
fi

mysql <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
systemctl enable --now mariadb >/dev/null 2>&1 || true
ok "Database ${DB_NAME} ready, owned by ${DB_USER}@localhost"

# ---------------------------------------------------------------------------
# PHP-FPM pool
#
# A pool of its own, running as the application user. The default
# www.conf pool stays untouched.
# ---------------------------------------------------------------------------
log "Configuring PHP-FPM"

cat > "/etc/php/${PHP_VERSION}/fpm/pool.d/amaso.conf" <<POOL
[amaso]
user = ${APP_USER}
group = ${APP_USER}
listen = /run/php/php-fpm-amaso.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

; Three to five people use this at once. Static workers keep memory
; predictable on a small VM and avoid the spawn delay on each request.
pm = static
pm.max_children = 5

; Reports can take a moment to render; the default 30s cuts off a large
; PDF export mid-stream.
request_terminate_timeout = 120

php_admin_value[upload_max_filesize] = 8M
php_admin_value[post_max_size] = 8M
php_admin_value[memory_limit] = 256M
php_admin_flag[display_errors] = off
php_admin_value[error_log] = /var/log/php-fpm-amaso.log
php_admin_flag[log_errors] = on
POOL

touch /var/log/php-fpm-amaso.log
chown "$APP_USER:$APP_USER" /var/log/php-fpm-amaso.log

systemctl enable "php${PHP_VERSION}-fpm" >/dev/null 2>&1 || true
systemctl restart "php${PHP_VERSION}-fpm"
ok "PHP-FPM pool 'amaso' listening on /run/php/php-fpm-amaso.sock"

# ---------------------------------------------------------------------------
# nginx
# ---------------------------------------------------------------------------
log "Configuring nginx"

sed -e "s|__APP_DIR__|${APP_DIR}|g" \
    -e "s|__SERVER_NAME__|${SERVER_NAME}|g" \
    "$(dirname "$(readlink -f "$0")")/nginx.conf.template" \
    > /etc/nginx/sites-available/amaso

# On a host without IPv6 in the kernel, `listen [::]:80` does not degrade
# gracefully - nginx refuses to start at all with "Address family not
# supported by protocol". Some cloud images ship that way, so the line is
# dropped rather than left to break the boot.
if [[ ! -e /proc/net/if_inet6 ]]; then
    sed -i '/listen \[::\]:80;/d' /etc/nginx/sites-available/amaso
    warn "No IPv6 on this host - removed the IPv6 listen directive"
fi

ln -sf /etc/nginx/sites-available/amaso /etc/nginx/sites-enabled/amaso
rm -f /etc/nginx/sites-enabled/default

# The site cannot start until deploy.sh has put files in place, so only
# check the syntax here.
if nginx -t 2>/dev/null; then
    systemctl enable nginx >/dev/null 2>&1 || true
    ok "nginx configuration valid"
else
    warn "nginx will report missing directories until deploy.sh has run once"
fi

# ---------------------------------------------------------------------------
# Firewall
# ---------------------------------------------------------------------------
if command -v ufw >/dev/null; then
    log "Opening the firewall"
    ufw allow OpenSSH >/dev/null 2>&1 || true
    ufw allow 'Nginx Full' >/dev/null 2>&1 || true
    yes | ufw enable >/dev/null 2>&1 || true
    ok "Ports 22, 80 and 443 open"
fi

# Oracle Cloud, AWS and Azure images ship a REJECT rule in iptables that
# blocks 80/443 no matter what ufw says. Opening it here saves an hour of
# wondering why the site is unreachable.
if command -v iptables >/dev/null && iptables -C INPUT -j REJECT --reject-with icmp-host-prohibited 2>/dev/null; then
    warn "The image has a default REJECT rule in iptables - inserting allow rules for 80 and 443"
    iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
    iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT
    if command -v netfilter-persistent >/dev/null; then
        netfilter-persistent save >/dev/null 2>&1 || true
    else
        apt-get install -y -qq iptables-persistent >/dev/null 2>&1 || true
    fi
fi

# ---------------------------------------------------------------------------
log "Server ready"
cat <<SUMMARY

    Application user   ${APP_USER}
    Application path   ${APP_DIR}
    Database           ${DB_NAME}  (user ${DB_USER}, password in /root/.amaso-db-password)
    PHP                ${PHP_VERSION}
    Web root           ${APP_DIR}/frontend/out
    API                ${APP_DIR}/backend/public

  Next:

    1. Put the code in place and build it:
         sudo bash deploy.sh https://github.com/MedBens02/Amaso.git

    2. If this server has a domain name, enable HTTPS:
         sudo bash enable-https.sh amaso.exemple.ma admin@exemple.ma

    3. Schedule the nightly backup:
         sudo bash backup.sh --install-cron

SUMMARY
