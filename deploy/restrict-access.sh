#!/usr/bin/env bash
#
# Put a gate in front of the whole site, so only the people you mean can
# reach even the login page.
#
#   sudo bash restrict-access.sh --password            a shared password, generated
#   sudo bash restrict-access.sh --password hunter2    a shared password you choose
#   sudo bash restrict-access.sh --ip 41.248.0.1       only these addresses
#   sudo bash restrict-access.sh --password --ip 41.248.0.1
#                                                      either: that address gets
#                                                      in without typing anything,
#                                                      everyone else needs the password
#   sudo bash restrict-access.sh --off                 remove the gate
#   sudo bash restrict-access.sh --status              what is in force now
#
# This sits in nginx, in front of everything - the login page, the API, the
# static files. It is not a replacement for signing in; it is a second door
# before the first one, which is what you want on a server the association
# is trying out and nobody else has any business finding.
#
# Let's Encrypt keeps working: the ACME challenge path is exempted, so
# certificates still issue and renew with the gate closed.

set -euo pipefail

HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=common.sh
source "$HERE/common.sh"

SITE="/etc/nginx/sites-available/amaso"
SNIPPET="/etc/nginx/snippets/amaso-gate-site.conf"
API_SNIPPET="/etc/nginx/snippets/amaso-gate-api.conf"
HTPASSWD="/etc/nginx/.amaso-htpasswd"
USERNAME="${RESTRICT_USER:-amaso}"

WANT_PASSWORD=0
PASSWORD=""
IPS=()
ACTION="apply"

while [[ $# -gt 0 ]]; do
    case "$1" in
        --password)
            WANT_PASSWORD=1
            # An argument only counts as the password if it is not the next flag.
            if [[ $# -ge 2 && "$2" != --* ]]; then PASSWORD="$2"; shift; fi
            shift ;;
        --ip)   IPS+=("${2:?--ip needs an address}"); shift 2 ;;
        --off)  ACTION="off"; shift ;;
        --status) ACTION="status"; shift ;;
        -h|--help)
            awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' "${BASH_SOURCE[0]}"
            exit 0 ;;
        *) die "Unknown option '$1'. Try --help." ;;
    esac
done

need_root
[[ -f "$SITE" ]] || die "$SITE not found - run provision.sh first."
mkdir -p /etc/nginx/snippets

# ---------------------------------------------------------------------------
# status
# ---------------------------------------------------------------------------
if [[ "$ACTION" == "status" ]]; then
    if [[ ! -s "$SNIPPET" ]]; then
        printf '\n    The site is %sopen to anyone%s who knows the address.\n\n' "$C_WARN" "$C_OFF"
        exit 0
    fi
    printf '\n    In force:\n\n'
    sed 's/^/      /' "$SNIPPET"
    if [[ -f "$HTPASSWD" ]]; then
        printf '\n    Password users: %s\n' "$(cut -d: -f1 "$HTPASSWD" | tr '\n' ' ')"
    fi
    printf '\n'
    exit 0
fi

# ---------------------------------------------------------------------------
# off
# ---------------------------------------------------------------------------
if [[ "$ACTION" == "off" ]]; then
    : > "$SNIPPET"
    : > "$API_SNIPPET"
    nginx -t >/dev/null 2>&1 || die "nginx configuration broke - run 'nginx -t'"
    systemctl reload nginx
    warn "The gate is removed. Anyone who knows the address can reach the login page."
    exit 0
fi

(( WANT_PASSWORD )) || (( ${#IPS[@]} )) \
    || die "Nothing to do. Pass --password, --ip, --off or --status."

# ---------------------------------------------------------------------------
# The include, for a site that was set up before this script existed
#
# A wildcard include is used in the template so that nginx does not refuse
# to start when the snippet has never been written. An older site file has
# no include at all, so one is added here.
# ---------------------------------------------------------------------------
if ! grep -q 'amaso-gate-site' "$SITE"; then
    sed -i '0,/^\s*charset/s||    include /etc/nginx/snippets/amaso-gate-site*.conf;\n\n    charset|' "$SITE"
    grep -q 'amaso-gate-site' "$SITE" || die "Could not add the include to $SITE - add it inside the server block by hand"
    ok "Added the restriction include to the site configuration"
fi

if ! grep -q 'amaso-gate-api' "$SITE"; then
    sed -i 's|\(\s*\)fastcgi_pass unix:/run/php/php-fpm-amaso.sock;|\1include /etc/nginx/snippets/amaso-gate-api*.conf;\n&|' "$SITE"
    grep -q 'amaso-gate-api' "$SITE" && ok "Added the API include to the site configuration"
fi

# The ACME challenge has to stay reachable without the gate, or certbot
# cannot prove ownership and renewal fails three months later - quietly,
# and on a site nobody is watching.
if ! grep -q 'acme-challenge' "$SITE"; then
    app_root="$(awk '/^\s*root\s/ {print $2}' "$SITE" | tr -d ';' | head -1)"
    sed -i "0,/^\s*charset/s||    location ^~ /.well-known/acme-challenge/ {\n        auth_basic off;\n        allow all;\n        root ${app_root:-/var/www/html};\n    }\n\n    charset|" "$SITE"
    ok "Exempted the Let's Encrypt challenge path from the gate"
fi

# ---------------------------------------------------------------------------
# Password file
# ---------------------------------------------------------------------------
if (( WANT_PASSWORD )); then
    if [[ -z "$PASSWORD" ]]; then
        # Readable over the phone: no look-alike characters.
        PASSWORD="$(tr -dc 'abcdefghjkmnpqrstuvwxyzACDEFGHJKLMNPQRSTUVWXYZ23456789' </dev/urandom | head -c 14)"
        GENERATED=1
    else
        GENERATED=0
    fi

    # apr1 via openssl, so this does not need apache2-utils installed.
    salt="$(tr -dc 'A-Za-z0-9' </dev/urandom | head -c 8)"
    hash="$(openssl passwd -apr1 -salt "$salt" "$PASSWORD")"
    printf '%s:%s\n' "$USERNAME" "$hash" > "$HTPASSWD"

    # The worker has to be able to read this, and it is not always
    # www-data - that is the Debian packaging's choice, not nginx's, and a
    # worker running as anyone else gets "Permission denied" and answers
    # 500 to every request including the correct password. Ask the running
    # configuration who it is rather than assuming.
    nginx_user="$(awk '$1=="user" { gsub(/;/,"",$2); print $2; exit }' /etc/nginx/nginx.conf 2>/dev/null)"
    [[ -n "$nginx_user" ]] || nginx_user="www-data"
    chown "root:${nginx_user}" "$HTPASSWD" 2>/dev/null || chown root:root "$HTPASSWD"
    chmod 640 "$HTPASSWD"
    ok "Password set for user '${USERNAME}'"
fi

# ---------------------------------------------------------------------------
# The snippet
#
# With both an allowlist and a password, `satisfy any` means either is
# enough: the office walks straight in, everyone else is asked. With only
# one of them, that one is required.
# ---------------------------------------------------------------------------
{
    printf '# Written by restrict-access.sh. Edit through that script.\n'

    if (( ${#IPS[@]} )) && (( WANT_PASSWORD )); then
        printf 'satisfy any;\n'
    fi

    for ip in "${IPS[@]+"${IPS[@]}"}"; do
        printf 'allow %s;\n' "$ip"
    done
    (( ${#IPS[@]} )) && printf 'deny all;\n'

    if (( WANT_PASSWORD )); then
        printf 'auth_basic "AMASO";\n'
        printf 'auth_basic_user_file %s;\n' "$HTPASSWD"
    fi

    # A test server has no business in anyone's search results.
    printf 'add_header X-Robots-Tag "noindex, nofollow, noarchive" always;\n'
} > "$SNIPPET"

# The API's half of the gate.
#
# A password gate has to be lifted here or the application stops working:
# the browser puts the gate's Basic credentials in the Authorization header,
# the app replaces them with its Bearer token, and nginx then rejects every
# API call. Laravel still requires that token, so /api is not open - it is
# guarded by the application's own authentication rather than by nginx.
#
# An allowlist carries no such conflict, so when that is the only gate it
# stays in force here as well, and the API is unreachable from anywhere else.
{
    printf '# Written by restrict-access.sh. Edit through that script.\n'
    if (( WANT_PASSWORD )); then
        printf 'auth_basic off;\n'
        printf 'satisfy any;\n'
        printf 'allow all;\n'
    fi
} > "$API_SNIPPET"

nginx -t >/dev/null 2>&1 || {
    : > "$SNIPPET"
    die "That configuration was rejected by nginx and has been undone - run 'nginx -t'"
}
systemctl reload nginx

# ---------------------------------------------------------------------------
log "The gate is up"

if (( ${#IPS[@]} )); then
    printf '    Allowed addresses   %s\n' "${IPS[*]}"
fi

if (( WANT_PASSWORD )); then
    printf '    Username            %s\n' "$USERNAME"
    if (( GENERATED )); then
        printf '    Password            %s%s%s\n' "$C_GOOD" "$PASSWORD" "$C_OFF"
        printf '\n    Write it down now - it is hashed in %s and cannot be read back.\n' "$HTPASSWD"
    else
        printf '    Password            (the one you passed)\n'
    fi
fi

cat <<'NOTE'

    Everyone gets a browser password prompt before they see anything,
    including the API and the static files. Once they answer it the
    browser keeps sending it, so the application behaves normally.

    To remove it later:   sudo bash restrict-access.sh --off

NOTE
