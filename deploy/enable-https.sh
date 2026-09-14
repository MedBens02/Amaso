#!/usr/bin/env bash
#
# Turns on HTTPS for a server that already answers on http://<domain>.
#
#   sudo bash enable-https.sh amaso.exemple.ma admin@exemple.ma
#
# Certbot needs the domain's DNS A record to already point at this server
# and port 80 to be reachable - that is how it proves ownership. Point the
# DNS first, wait for it to propagate, then run this.
#
# If www.<domain> also points here, it is included on the certificate
# automatically. Pass --no-www to skip that.
#
# The certificate renews itself; certbot installs the timer that does it.

set -euo pipefail

HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=common.sh
source "$HERE/common.sh"

APP_USER="${APP_USER:-amaso}"
APP_DIR="${APP_DIR:-/var/www/amaso}"

DOMAIN=""
EMAIL=""
WANT_WWW=1

for arg in "$@"; do
    case "$arg" in
        --no-www) WANT_WWW=0 ;;
        *@*)      EMAIL="$arg" ;;
        *)        [[ -z "$DOMAIN" ]] && DOMAIN="$arg" ;;
    esac
done

need_root
[[ -n "$DOMAIN" && -n "$EMAIL" ]] \
    || die "Usage: sudo bash enable-https.sh amaso.exemple.ma admin@exemple.ma [--no-www]"

# ---------------------------------------------------------------------------
# Check the DNS before asking Let's Encrypt for anything: certbot failures
# count against a rate limit, and a domain that does not resolve here yet is
# by far the most common reason for one.
# ---------------------------------------------------------------------------
log "Checking DNS for $DOMAIN"

server_ip="$(public_ip)"
domain_ip="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1)"

if [[ -z "$domain_ip" ]]; then
    die "$DOMAIN does not resolve. Add an A record pointing at $server_ip and wait for it to propagate."
fi

if [[ "$domain_ip" != "$server_ip" ]]; then
    warn "$DOMAIN resolves to $domain_ip, but this server is $server_ip."
    printf '        If you are behind a proxy such as Cloudflare this is expected.\n'
    printf '        Otherwise the certificate request will fail.\n\n'
    read -r -p "    Continue anyway? [y/N] " answer
    [[ "$answer" =~ ^[Yy]$ ]] || exit 1
else
    ok "$DOMAIN points at this server"
fi

# www is offered on the certificate only if it already resolves here.
# Asking for a name that does not resolve fails the whole request, taking
# the apex down with it - so it is checked rather than assumed.
DOMAINS=("$DOMAIN")
if (( WANT_WWW )) && [[ "$DOMAIN" != www.* ]]; then
    www_ip="$(getent hosts "www.$DOMAIN" | awk '{print $1}' | head -1)"
    if [[ -n "$www_ip" ]]; then
        DOMAINS+=("www.$DOMAIN")
        ok "www.$DOMAIN resolves too - including it on the certificate"
    else
        warn "www.$DOMAIN does not resolve - the certificate will cover $DOMAIN only"
        printf '        Add a CNAME for www pointing at %s and re-run this to include it.\n' "$DOMAIN"
    fi
fi

# ---------------------------------------------------------------------------
log "Installing certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx
ok "certbot installed"

# ---------------------------------------------------------------------------
# The site is provisioned with `server_name _`, which certbot cannot match
# against a certificate. Name it before asking for one.
# ---------------------------------------------------------------------------
log "Setting the server name"
sed -i "s|^\(\s*\)server_name .*;|\1server_name ${DOMAINS[*]};|" /etc/nginx/sites-available/amaso
nginx -t >/dev/null 2>&1 || die "The nginx configuration is invalid - run 'nginx -t'"
systemctl reload nginx
ok "nginx now answers for ${DOMAINS[*]}"

# ---------------------------------------------------------------------------
log "Requesting the certificate"
certbot_args=()
for d in "${DOMAINS[@]}"; do certbot_args+=(--domain "$d"); done

certbot --nginx \
    "${certbot_args[@]}" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --redirect \
    --non-interactive
ok "Certificate installed, HTTP redirects to HTTPS"

# ---------------------------------------------------------------------------
# HSTS
#
# Added only now, and never before the certificate works. The header tells
# every browser that has once seen it to refuse plain HTTP for this name
# for a year - which is exactly what you want on a site holding personal
# records, and exactly what you do not want set while HTTPS is still
# broken, because it locks visitors out of the only working version.
# ---------------------------------------------------------------------------
if ! grep -q "Strict-Transport-Security" /etc/nginx/sites-available/amaso; then
    sed -i '/listen 443 ssl/a\    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;' \
        /etc/nginx/sites-available/amaso
    if nginx -t >/dev/null 2>&1; then
        ok "HSTS enabled (browsers will refuse plain HTTP for a year)"
    else
        sed -i '/Strict-Transport-Security/d' /etc/nginx/sites-available/amaso
        warn "Could not add the HSTS header cleanly - left it off"
    fi
fi

systemctl reload nginx

# ---------------------------------------------------------------------------
# Tell the application its own address
#
# Laravel builds absolute URLs from APP_URL. It is written as the bare IP
# at deploy time because that is all that is known then; now there is a
# real name for it.
# ---------------------------------------------------------------------------
env_file="$APP_DIR/backend/.env"
if [[ -f "$env_file" ]]; then
    set_env "$env_file" APP_URL "https://${DOMAIN}"
    chown "$APP_USER:$APP_USER" "$env_file"
    chmod 600 "$env_file"
    sudo -u "$APP_USER" -H php "$APP_DIR/backend/artisan" config:cache --quiet || true
    ok "APP_URL set to https://${DOMAIN}"
fi

log "Done"
cat <<SUMMARY

    The application is at  https://${DOMAIN}

    The certificate renews automatically. To confirm the timer is armed:
        systemctl list-timers | grep certbot

    To test a renewal without using up a rate-limit attempt:
        certbot renew --dry-run

SUMMARY
