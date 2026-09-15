#!/usr/bin/env bash
#
# Shared by every script in this directory. Sourced, never run.
#
# The scripts each used to carry their own copy of the logging helpers,
# which is how two of them ended up with a slightly different idea of what
# a warning looked like. One copy here instead.

# ---------------------------------------------------------------------------
# Output
# ---------------------------------------------------------------------------
if [[ -t 1 ]]; then
    C_STEP=$'\033[1;36m'; C_OK=$'\033[0;32m'; C_WARN=$'\033[0;33m'
    C_ERR=$'\033[0;31m';  C_GOOD=$'\033[1;32m'; C_OFF=$'\033[0m'
else
    C_STEP=''; C_OK=''; C_WARN=''; C_ERR=''; C_GOOD=''; C_OFF=''
fi

log()  { printf '\n%s==> %s%s\n' "$C_STEP" "$*" "$C_OFF"; }
ok()   { printf '    %s[ok]%s %s\n' "$C_OK" "$C_OFF" "$*"; }
warn() { printf '    %s[!]%s %s\n' "$C_WARN" "$C_OFF" "$*"; }
die()  { printf '\n%s[x] %s%s\n\n' "$C_ERR" "$*" "$C_OFF" >&2; exit 1; }

need_root() {
    [[ $EUID -eq 0 ]] || die "Run this as root:  sudo bash $(basename "${BASH_SOURCE[1]}") $*"
}

# ---------------------------------------------------------------------------
# .env editing
#
# The reason this is not a sed one-liner: Laravel's .env.example ships most
# of the database block commented out -
#
#     DB_CONNECTION=sqlite
#     # DB_HOST=127.0.0.1
#     # DB_DATABASE=laravel
#
# - and `sed -e 's|^DB_HOST=.*|DB_HOST=127.0.0.1|'` does not match a line
# that starts with "# ". The deploy that used those seds wrote DB_CONNECTION
# and nothing else, so Laravel fell through to the framework defaults
# (database "laravel", user "root", no password) and the first migration
# failed with an access-denied error that pointed at nothing obvious.
#
# set_env replaces the key whether it is set, commented out or absent, and
# writes back through the existing file so its owner and its 600 mode
# survive.
# ---------------------------------------------------------------------------
set_env() {
    local file="$1" key="$2" value="$3"
    local tmp line found=0

    [[ -f "$file" ]] || die "set_env: $file does not exist"

    # Anything that is not a bare word gets quoted: Laravel's parser splits
    # an unquoted value at the first space, and treats a # as the start of a
    # comment. An organisation name would otherwise arrive truncated.
    if [[ ! "$value" =~ ^[A-Za-z0-9_./:@-]*$ ]]; then
        value="\"${value//\"/\\\"}\""
    fi

    tmp="$(mktemp)"
    while IFS= read -r line || [[ -n "$line" ]]; do
        if [[ "$line" =~ ^[[:space:]]*#?[[:space:]]*"$key"= ]]; then
            # Keep the key in its original position, and drop any further
            # copies - a file with both a commented and an uncommented
            # DB_HOST should not come out with two.
            if (( found == 0 )); then
                printf '%s=%s\n' "$key" "$value" >> "$tmp"
                found=1
            fi
            continue
        fi
        printf '%s\n' "$line" >> "$tmp"
    done < "$file"

    (( found == 0 )) && printf '%s=%s\n' "$key" "$value" >> "$tmp"

    cat "$tmp" > "$file"
    rm -f "$tmp"
}

# Read a key back out of an .env file, for checking what was written.
get_env() {
    local file="$1" key="$2"
    [[ -f "$file" ]] || return 1
    sed -n "s|^${key}=||p" "$file" | head -1 | sed -e 's|^"||' -e 's|"$||'
}

# ---------------------------------------------------------------------------
# Random strings
#
#   random_string 14 'abc...XYZ23456789'
#
# Deliberately not the obvious `tr -dc SET </dev/urandom | head -c N`.
# head closes the pipe the moment it has N bytes; tr, still reading a device
# that never ends, is killed by SIGPIPE; `set -o pipefail` reports the
# pipeline as failed; and `set -e` exits the script - with nothing printed,
# because this runs before the first line of output. That is a guaranteed
# failure rather than an occasional one, since tr can never finish first.
#
# Here the randomness is a fixed block, so every command in the pipeline
# reaches its own end of input, and the filtering is done by bash.
# ---------------------------------------------------------------------------
random_string() {
    local length="$1" allowed="$2" raw clean
    raw="$(head -c 512 /dev/urandom | base64 | tr -d '\n')"
    clean="${raw//[^$allowed]/}"
    if (( ${#clean} < length )); then
        die "random_string: only ${#clean} usable characters from 512 bytes; widen the allowed set"
    fi
    printf '%s' "${clean:0:length}"
}

# ---------------------------------------------------------------------------
# Facts about the machine
# ---------------------------------------------------------------------------

# Total RAM in MB.
ram_mb() { awk '/^MemTotal:/ {print int($2/1024)}' /proc/meminfo; }

# Configured swap in MB (0 when there is none).
swap_mb() { awk '/^SwapTotal:/ {print int($2/1024)}' /proc/meminfo; }

# The status code a URL answers with, or 000 if it could not be reached.
#
# Written once, here, because it had to be written correctly three times
# otherwise - and was not. curl prints "000" of its own accord when it
# cannot connect and also exits non-zero, so the obvious
# `curl ... || echo 000` appends a second value and reports "000000"; with
# -f it does the same to a real code and reports "400000". No -f, and the
# default only fills in for genuinely empty output.
http_code() {
    local code
    code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time "${2:-12}" "$1" 2>/dev/null)" || true
    printf '%s' "${code:-000}"
}

# Where things live
#
# One definition each. The site file and the two gate snippets were spelled
# out as literals in four scripts between them. They agree today and nothing
# but habit was keeping them that way, which is the same shape as every
# other duplicated-fact bug in this tree.
NGINX_SITE="${NGINX_SITE:-/etc/nginx/sites-available/amaso}"
NGINX_ENABLED="${NGINX_ENABLED:-/etc/nginx/sites-enabled/amaso}"
NGINX_SNIPPETS="${NGINX_SNIPPETS:-/etc/nginx/snippets}"
GATE_SITE_SNIPPET="$NGINX_SNIPPETS/amaso-gate-site.conf"
GATE_API_SNIPPET="$NGINX_SNIPPETS/amaso-gate-api.conf"

# The site nginx is configured for
#
# These exist because http://127.0.0.1/ stopped being a usable health check
# the moment certbot ran. With --redirect it rewrites the port-80 server
# block to redirect the names on the certificate and answer
#
#     return 404;   # managed by Certbot
#
# to every other Host - and a loopback request by IP carries
# Host: 127.0.0.1, which is every other Host. The site was serving every
# real visitor correctly while status.sh called both halves of it broken.

# The first real name nginx answers for, or nothing while it is still the
# `_` catch-all that provision.sh installs.
#
# `tr` first, because nginx separates directives with semicolons and braces
# and does not care about newlines: `server { listen 80; server_name x;` on
# one line is valid, and a pattern anchored to the start of a line silently
# misses it - reporting a named site as unnamed, or a TLS site as plain,
# and sending the health check back to the loopback address it cannot use.
# Splitting on those separators puts every directive at the start of a line
# whatever the file looks like.
#
# Wildcard and regex names are skipped: `*.amaso.site` is something nginx
# matches against, not a name anything can connect to.
site_host() {
    [[ -f "$NGINX_SITE" ]] || return 0
    tr ';{}' '\n\n\n' < "$NGINX_SITE" \
        | awk '/^[[:space:]]*server_name[[:space:]]/ {
                   for (i = 2; i <= NF; i++) {
                       if ($i != "_" && $i !~ /^[*~]/) { print $i; exit }
                   }
               }'
}

# Whether that site has been given a certificate.
site_is_tls() {
    [[ -f "$NGINX_SITE" ]] || return 1
    tr ';{}' '\n\n\n' < "$NGINX_SITE" \
        | grep -qE '^[[:space:]]*listen[[:space:]]+.*\b443\b'
}

# The status code the local nginx answers with for one of its own names.
#
# --resolve keeps the connection on loopback while sending the Host header
# and the TLS SNI that nginx actually selects a server block on, so the
# check needs no DNS, no route out to the internet, and no ability for the
# machine to reach its own public address - which on EC2 is not a given.
# --noproxy because a health check of this machine must never be answered
# by a proxy that happens to be in the environment.
http_code_site() {
    local host="$1" path="${2:-/}" scheme="${3:-https}" port code
    [[ "$scheme" == "https" ]] && port=443 || port=80
    code="$(curl -sS --noproxy '*' -o /dev/null -w '%{http_code}' --max-time "${4:-12}" \
        --resolve "${host}:${port}:127.0.0.1" "${scheme}://${host}${path}" 2>/dev/null)" || true
    printf '%s' "${code:-000}"
}

# The address a name resolves to here, or nothing at all.
#
# `getent hosts` exits 2 for a name that does not resolve. Under
# `set -o pipefail` that failure comes out of the assignment, and `set -e`
# then ends the script - so every branch written to handle "this domain does
# not resolve yet" was unreachable, and the caller simply stopped without
# explaining itself. That is the case these functions exist to report on, so
# a failed lookup has to come back as an empty answer rather than an error.
resolve_host() {
    getent hosts "$1" 2>/dev/null | awk '{print $1}' | head -1 || true
}

# The address the outside world reaches this machine on. Falls back to the
# first local address when there is no outbound access to ask.
public_ip() {
    local ip
    ip="$(curl -fsS --max-time 4 https://api.ipify.org 2>/dev/null)" \
        || ip="$(curl -fsS --max-time 4 https://ifconfig.me 2>/dev/null)" \
        || ip=""
    [[ -z "$ip" ]] && ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
    printf '%s' "$ip"
}

# The php-fpm unit actually installed, whatever minor version it is.
php_fpm_unit() {
    systemctl list-units --type=service --plain --no-legend 'php*-fpm.service' 2>/dev/null \
        | awk '{print $1}' | head -1
}
