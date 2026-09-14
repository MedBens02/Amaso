#!/usr/bin/env bash
#
# Prepares a fresh Ubuntu server to run AMASO. Run once, as root, on a
# newly created VM. It is safe to re-run: every step checks its own state
# first.
#
#   sudo bash provision.sh
#
# Installs nginx, PHP-FPM, MariaDB, Node and Composer, creates the
# database and its user, sizes swap and the PHP worker pool to the machine
# it finds, writes the site configuration and opens the firewall. It does
# not fetch the application - deploy.sh does that.
#
# Tested against Ubuntu 22.04 and 24.04.

set -euo pipefail

HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=common.sh
source "$HERE/common.sh"

APP_USER="${APP_USER:-amaso}"
APP_DIR="${APP_DIR:-/var/www/amaso}"
DB_NAME="${DB_NAME:-amaso}"
DB_USER="${DB_USER:-amaso}"
SERVER_NAME="${SERVER_NAME:-_}"
PHP_VERSION="${PHP_VERSION:-}"
TIMEZONE="${TIMEZONE:-Africa/Casablanca}"

# The frontend build is the memory high-water mark of the whole system:
# measured at 1.34 GB peak resident for this application. Everything below
# sizes itself so that build can finish on the smallest VPS worth renting.
BUILD_PEAK_MB=1400
TARGET_TOTAL_MB="${TARGET_TOTAL_MB:-4096}"

need_root
command -v apt-get >/dev/null || die "This script targets Debian/Ubuntu (apt-get not found)."

# ---------------------------------------------------------------------------
# Preflight
#
# Both of these are cheap to check and expensive to discover later: a
# half-installed server with a full disk is harder to reason about than one
# that refused to start.
# ---------------------------------------------------------------------------
log "Checking the machine"

os_name="$(. /etc/os-release && echo "${ID:-unknown}")"
os_version="$(. /etc/os-release && echo "${VERSION_ID:-}")"
[[ "$os_name" == "ubuntu" || "$os_name" == "debian" ]] \
    || warn "This is '${os_name}', not Ubuntu - continuing, but nothing here is tested on it"

disk_free_mb="$(df -Pm / | awk 'NR==2 {print $4}')"
(( disk_free_mb >= 6000 )) \
    || die "Only ${disk_free_mb} MB free on / - the install needs about 6 GB (Node, Composer, swap)."
ok "${os_name} ${os_version}, ${disk_free_mb} MB free on /, $(ram_mb) MB RAM"

# ---------------------------------------------------------------------------
# Swap
#
# The one step that decides whether a cheap VPS can run this at all.
# `next build` peaks around 1.4 GB, so on a 1 GB box - Hostinger's KVM 1,
# and the equivalent elsewhere - the build is killed by the OOM reaper part
# way through, leaving frontend/out missing and an error that says only
# "Killed". Swap turns that from a failure into a slow success: the build
# runs a few minutes longer and completes.
#
# Swap is not a substitute for RAM at request time. It is here for the
# build, which happens once per deploy and can afford to touch disk;
# swappiness is set low so the running services stay resident.
# ---------------------------------------------------------------------------
log "Sizing swap"

ram="$(ram_mb)"
swap="$(swap_mb)"
total=$(( ram + swap ))

if (( total >= TARGET_TOTAL_MB )); then
    ok "${ram} MB RAM + ${swap} MB swap = ${total} MB, enough for a ${BUILD_PEAK_MB} MB build"
elif [[ -e /swapfile ]] && (( swap > 0 )); then
    warn "/swapfile already exists (${swap} MB) - leaving it alone. Total is ${total} MB."
else
    want=$(( TARGET_TOTAL_MB - total ))
    # Leave the disk room to breathe: never spend more than a third of what
    # is free, and never more than 4 GB.
    max_affordable=$(( disk_free_mb / 3 ))
    (( want > max_affordable )) && want=$max_affordable
    (( want > 4096 )) && want=4096

    if (( want < 512 )); then
        warn "Not enough free disk for a useful swapfile - skipping"
    else
        if fallocate -l "${want}M" /swapfile 2>/dev/null || \
           dd if=/dev/zero of=/swapfile bs=1M count="$want" status=none 2>/dev/null; then
            chmod 600 /swapfile
            mkswap /swapfile >/dev/null
            if swapon /swapfile 2>/dev/null; then
                grep -q '^/swapfile' /etc/fstab || printf '/swapfile none swap sw 0 0\n' >> /etc/fstab
                ok "Created ${want} MB of swap at /swapfile (total now $(( ram + $(swap_mb) )) MB)"
            else
                rm -f /swapfile
                warn "This kernel refuses swapon (common on OpenVZ) - no swap. The build may fail on a small box."
            fi
        else
            rm -f /swapfile
            warn "Could not allocate a swapfile - continuing without one"
        fi
    fi
fi

# Keep the running services in RAM; the swap is for the build, not for
# paging out MariaDB while somebody is entering an income.
cat > /etc/sysctl.d/60-amaso.conf <<'SYSCTL'
vm.swappiness=10
vm.vfs_cache_pressure=50
SYSCTL
sysctl --quiet --load /etc/sysctl.d/60-amaso.conf 2>/dev/null || true

# ---------------------------------------------------------------------------
# Clock
#
# Records carry timestamps and the nightly backup runs on a schedule; both
# read wrong if the box thinks it is somewhere else. The application itself
# stores UTC and the browser converts, so this is for the logs, the cron
# entries and anyone reading them over SSH.
# ---------------------------------------------------------------------------
if command -v timedatectl >/dev/null && [[ "$(timedatectl show -p Timezone --value 2>/dev/null)" != "$TIMEZONE" ]]; then
    timedatectl set-timezone "$TIMEZONE" 2>/dev/null && ok "Clock set to $TIMEZONE" \
        || warn "Could not set the timezone to $TIMEZONE"
fi

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
    case "$os_version" in
        24.*|25.*) PHP_VERSION="8.3" ;;
        *)
            warn "Ubuntu ${os_version:-unknown} ships PHP 8.1 or older; adding the ondrej/php PPA"
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
    nginx mariadb-server curl git unzip rsync ca-certificates \
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
# Unattended security updates and SSH brute-force protection
#
# This box holds names, national ID numbers and phone numbers of widows and
# orphans. It will not have an administrator watching it. Both of these are
# the minimum that assumption deserves.
# ---------------------------------------------------------------------------
log "Turning on automatic security updates and fail2ban"

apt-get install -y -qq unattended-upgrades fail2ban >/dev/null 2>&1 || true

if [[ -d /etc/apt/apt.conf.d ]]; then
    cat > /etc/apt/apt.conf.d/20auto-upgrades <<'AUTO'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
AUTO
    ok "Security updates install themselves"
fi

if command -v fail2ban-server >/dev/null; then
    cat > /etc/fail2ban/jail.d/amaso.conf <<'JAIL'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
JAIL
    systemctl enable fail2ban >/dev/null 2>&1 || true
    systemctl restart fail2ban >/dev/null 2>&1 || true
    ok "fail2ban watching SSH"
fi

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
#
# MariaDB is started before anything talks to it. The previous version of
# this script ran the CREATE DATABASE first and called `systemctl enable
# --now mariadb` afterwards, which worked only because the package happens
# to start the server itself - a detail no script should be leaning on.
# ---------------------------------------------------------------------------
log "Starting MariaDB"

systemctl enable --now mariadb >/dev/null 2>&1 || systemctl enable --now mysql >/dev/null 2>&1 || true

for _ in $(seq 1 30); do
    mysqladmin ping >/dev/null 2>&1 && break
    sleep 1
done
mysqladmin ping >/dev/null 2>&1 || die "MariaDB did not come up - check 'systemctl status mariadb'"
ok "MariaDB is answering"

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
ok "Database ${DB_NAME} ready, owned by ${DB_USER}@localhost"

# What mysql_secure_installation does, minus the interactive prompts: the
# anonymous account can read the schema, and the test database is world
# writable. Neither belongs on a server holding national ID numbers.
#
# Best-effort rather than fatal. mysql.global_priv is MariaDB's table -
# this script installs mariadb-server, but on a box that already had MySQL
# the statement would fail, and losing the whole provision over a hardening
# step that is already mostly done by the packaging is the wrong trade.
if mysql <<'SQL' 2>/dev/null
DELETE FROM mysql.global_priv WHERE User='';
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\_%';
FLUSH PRIVILEGES;
SQL
then
    ok "Anonymous accounts and the test database removed"
else
    warn "Could not apply the MariaDB hardening statements - check 'mysql_secure_installation' by hand"
fi

# ---------------------------------------------------------------------------
# PHP-FPM pool
#
# A pool of its own, running as the application user. The default www.conf
# pool stays untouched.
#
# The worker count is computed rather than fixed. The old value - five
# static workers at a 256 MB limit each - reserves up to 1.25 GB on a
# machine that may only have 1 GB, and holds all five resident whether or
# not anyone is using the application. ondemand starts a worker when a
# request needs one and lets it go when it has been idle a minute, which
# suits three to five people entering records far better than a permanently
# resident pool; opcache lives in shared memory, so a freshly spawned
# worker attaches to the already-compiled code rather than recompiling it.
# ---------------------------------------------------------------------------
log "Configuring PHP-FPM"

# 128 MB is what a worker actually uses serving ordinary requests; the
# 256 MB limit below is a ceiling for report generation, not a reservation.
# Allow the pool at most 40% of RAM, and keep it between 2 and 8 workers.
fpm_children=$(( ram * 40 / 100 / 128 ))
(( fpm_children < 2 )) && fpm_children=2
(( fpm_children > 8 )) && fpm_children=8

cat > "/etc/php/${PHP_VERSION}/fpm/pool.d/amaso.conf" <<POOL
[amaso]
user = ${APP_USER}
group = ${APP_USER}
listen = /run/php/php-fpm-amaso.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660

; Sized for ${ram} MB of RAM. Workers appear on demand and retire when
; idle, so an idle server holds none of this.
pm = ondemand
pm.max_children = ${fpm_children}
pm.process_idle_timeout = 60s
pm.max_requests = 500

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
ok "Pool sized to ${fpm_children} on-demand workers"

touch /var/log/php-fpm-amaso.log
chown "$APP_USER:$APP_USER" /var/log/php-fpm-amaso.log

# ---------------------------------------------------------------------------
# opcache
#
# Laravel reads and compiles a little over five hundred PHP files to answer
# one request. opcache keeps the compiled form in memory so that happens
# once per worker rather than once per request - the difference between a
# request that costs tens of milliseconds and one that costs hundreds.
#
# validate_timestamps=0 is the part that only makes sense in production: it
# stops PHP stat()ing all five hundred files on every request to ask whether
# any changed. Nothing changes them except deploy.sh, which reloads PHP-FPM
# and so clears the cache anyway. Never set this on a development machine -
# edits would appear to have no effect.
# ---------------------------------------------------------------------------
cat > "/etc/php/${PHP_VERSION}/fpm/conf.d/99-amaso-opcache.ini" <<'OPCACHE'
opcache.enable=1
opcache.memory_consumption=192
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.save_comments=1
OPCACHE
ok "opcache tuned for production"

systemctl enable "php${PHP_VERSION}-fpm" >/dev/null 2>&1 || true
systemctl restart "php${PHP_VERSION}-fpm"
ok "PHP-FPM pool 'amaso' listening on /run/php/php-fpm-amaso.sock"

# ---------------------------------------------------------------------------
# Log rotation
#
# Both of these are written to forever by something that never restarts.
# Left alone they are the most likely thing to fill the disk a year from
# now, at which point MariaDB stops accepting writes and the application
# looks broken for a reason nobody would guess.
# ---------------------------------------------------------------------------
cat > /etc/logrotate.d/amaso <<ROTATE
/var/log/php-fpm-amaso.log {
    weekly
    rotate 8
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
    su ${APP_USER} ${APP_USER}
}

/var/log/amaso-backup.log {
    monthly
    rotate 12
    missingok
    notifempty
    compress
    copytruncate
}

${APP_DIR}/backend/storage/logs/*.log {
    weekly
    rotate 8
    missingok
    notifempty
    compress
    delaycompress
    copytruncate
    su ${APP_USER} ${APP_USER}
}
ROTATE
ok "Logs rotate weekly"

# ---------------------------------------------------------------------------
# nginx
# ---------------------------------------------------------------------------
log "Configuring nginx"

sed -e "s|__APP_DIR__|${APP_DIR}|g" \
    -e "s|__SERVER_NAME__|${SERVER_NAME}|g" \
    "$HERE/nginx.conf.template" \
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
    PHP                ${PHP_VERSION}, ${fpm_children} on-demand workers
    Memory             ${ram} MB RAM + $(swap_mb) MB swap
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
