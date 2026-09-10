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
# The certificate renews itself; certbot installs the timer that does it.

set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[0;32m[ok]\033[0m %s\n' "$*"; }
die()  { printf '\n\033[0;31m[x] %s\033[0m\n\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "Run this as root:  sudo bash enable-https.sh <domain> <email>"
[[ -n "$DOMAIN" && -n "$EMAIL" ]] || die "Usage: sudo bash enable-https.sh amaso.exemple.ma admin@exemple.ma"

# ---------------------------------------------------------------------------
# Check the DNS before asking Let's Encrypt for anything: certbot failures
# count against a rate limit, and a domain that does not resolve here yet is
# by far the most common reason for one.
# ---------------------------------------------------------------------------
log "Checking DNS for $DOMAIN"

server_ip="$(curl -s --max-time 5 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
domain_ip="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1)"

if [[ -z "$domain_ip" ]]; then
    die "$DOMAIN does not resolve. Add an A record pointing at $server_ip and wait for it to propagate."
fi

if [[ "$domain_ip" != "$server_ip" ]]; then
    printf '\n    \033[0;33m[!]\033[0m %s resolves to %s, but this server is %s.\n' "$DOMAIN" "$domain_ip" "$server_ip"
    printf '        If you are behind a proxy such as Cloudflare this is expected.\n'
    printf '        Otherwise the certificate request will fail.\n\n'
    read -r -p "    Continue anyway? [y/N] " answer
    [[ "$answer" =~ ^[Yy]$ ]] || exit 1
else
    ok "$DOMAIN points at this server"
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
sed -i "s|^\(\s*\)server_name .*;|\1server_name ${DOMAIN};|" /etc/nginx/sites-available/amaso
nginx -t >/dev/null 2>&1 || die "The nginx configuration is invalid - run 'nginx -t'"
systemctl reload nginx
ok "nginx now answers for $DOMAIN"

# ---------------------------------------------------------------------------
log "Requesting the certificate"
certbot --nginx \
    --domain "$DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --redirect \
    --non-interactive
ok "Certificate installed, HTTP redirects to HTTPS"

systemctl reload nginx

log "Done"
cat <<SUMMARY

    The application is at  https://${DOMAIN}

    The certificate renews automatically. To confirm the timer is armed:
        systemctl list-timers | grep certbot

    To test a renewal without using up a rate-limit attempt:
        certbot renew --dry-run

SUMMARY
