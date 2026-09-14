#!/usr/bin/env bash
#
# One command, from a bare Ubuntu VM to a working AMASO.
#
#   sudo bash bootstrap.sh
#   sudo bash bootstrap.sh --domain amaso.exemple.ma --email admin@exemple.ma
#
# It runs provision.sh, then deploy.sh, then schedules the nightly backup,
# and finally turns on HTTPS if a domain was given and already points here.
#
# Everything it calls is safe to re-run, so this is too: if it stops part
# way - a package mirror times out, DNS has not propagated - fix the cause
# and run the same line again.
#
# Options
#   --repo   <url>      where to clone from   (default: the upstream repo)
#   --branch <name>     which branch          (default: the repo's own default)
#   --domain <name>     the site's hostname   (optional; enables HTTPS)
#   --email  <address>  for Let's Encrypt     (required with --domain)
#   --demo              fill the database with invented test data
#   --skip-provision    the server is already prepared
#   --no-backup-cron    do not schedule the nightly backup
#
# --demo is for a server the team is trying out, never for the real one. It
# seeds invented families, money and school records so there is something to
# click through, and it refuses to run into a database that already holds
# families.

set -euo pipefail

HERE="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
# shellcheck source=common.sh
source "$HERE/common.sh"

REPO="https://github.com/MedBens02/Amaso.git"
BRANCH=""
DOMAIN=""
EMAIL=""
SKIP_PROVISION=0
BACKUP_CRON=1
SEED_DEMO=0

while [[ $# -gt 0 ]]; do
    case "$1" in
        --repo)           REPO="${2:?--repo needs a URL}"; shift 2 ;;
        --branch)         BRANCH="${2:?--branch needs a name}"; shift 2 ;;
        --domain)         DOMAIN="${2:?--domain needs a hostname}"; shift 2 ;;
        --email)          EMAIL="${2:?--email needs an address}"; shift 2 ;;
        --demo)           SEED_DEMO=1; shift ;;
        --skip-provision) SKIP_PROVISION=1; shift ;;
        --no-backup-cron) BACKUP_CRON=0; shift ;;
        # Print the header comment and stop at the first line of code, so
        # the help text cannot drift out of range when this file is edited.
        -h|--help)        awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' \
                              "${BASH_SOURCE[0]}"; exit 0 ;;
        *)                die "Unknown option '$1'. Try --help." ;;
    esac
done

need_root
[[ -z "$DOMAIN" || -n "$EMAIL" ]] || die "--domain needs --email as well (Let's Encrypt requires a contact address)."

started="$(date +%s)"

printf '\n%s  AMASO - full install%s\n' "$C_STEP" "$C_OFF"
printf '    repository  %s\n' "$REPO"
printf '    branch      %s\n' "${BRANCH:-<the repository's default>}"
printf '    domain      %s\n' "${DOMAIN:-<none - the site will answer on its IP>}"
printf '    data        %s\n' "$( (( SEED_DEMO )) && echo 'INVENTED DEMO DATA' || echo 'empty - ready for real records')"
printf '    machine     %s MB RAM, %s MB swap, %s MB free on /\n\n' \
    "$(ram_mb)" "$(swap_mb)" "$(df -Pm / | awk 'NR==2 {print $4}')"

# ---------------------------------------------------------------------------
# 1. The server
# ---------------------------------------------------------------------------
if (( SKIP_PROVISION )); then
    warn "Skipping provision.sh as asked"
else
    printf '%s╺━ 1/4  Preparing the server ━╸%s\n' "$C_STEP" "$C_OFF"
    bash "$HERE/provision.sh"
fi

# ---------------------------------------------------------------------------
# 2. The application
# ---------------------------------------------------------------------------
printf '\n%s╺━ 2/4  Installing the application ━╸%s\n' "$C_STEP" "$C_OFF"
deploy_args=()
(( SEED_DEMO )) && deploy_args+=(--demo)
deploy_args+=("$REPO")

if [[ -n "$BRANCH" ]]; then
    BRANCH="$BRANCH" bash "$HERE/deploy.sh" "${deploy_args[@]}"
else
    bash "$HERE/deploy.sh" "${deploy_args[@]}"
fi

# ---------------------------------------------------------------------------
# 3. Backups
#
# Scheduled before HTTPS deliberately. HTTPS can fail for reasons outside
# this machine - a DNS record that has not propagated - and a server whose
# nightly backup depends on getting that far is a server with no backups.
# ---------------------------------------------------------------------------
if (( BACKUP_CRON )); then
    printf '\n%s╺━ 3/4  Scheduling the nightly backup ━╸%s\n' "$C_STEP" "$C_OFF"
    bash "$HERE/backup.sh" --install-cron
    bash "$HERE/backup.sh" --now
else
    warn "Skipping the backup schedule as asked"
fi

# ---------------------------------------------------------------------------
# 4. HTTPS
# ---------------------------------------------------------------------------
https_done=0
if [[ -n "$DOMAIN" ]]; then
    printf '\n%s╺━ 4/4  Enabling HTTPS ━╸%s\n' "$C_STEP" "$C_OFF"

    resolved="$(getent hosts "$DOMAIN" | awk '{print $1}' | head -1)"
    if [[ -z "$resolved" ]]; then
        warn "$DOMAIN does not resolve yet - skipping HTTPS."
        printf '        Point an A record at %s, wait for it, then run:\n' "$(public_ip)"
        printf '            sudo bash %s/enable-https.sh %s %s\n' "$HERE" "$DOMAIN" "$EMAIL"
    else
        # `yes |` answers the "continue anyway?" prompt that enable-https.sh
        # raises when the domain resolves somewhere else - behind Cloudflare
        # that is the normal case, and there is nobody at the keyboard here.
        if yes | bash "$HERE/enable-https.sh" "$DOMAIN" "$EMAIL"; then
            https_done=1
        else
            warn "HTTPS did not complete - the site still works over http://"
            printf '        Re-run:  sudo bash %s/enable-https.sh %s %s\n' "$HERE" "$DOMAIN" "$EMAIL"
        fi
    fi
else
    printf '\n%s╺━ 4/4  HTTPS ━╸%s\n' "$C_STEP" "$C_OFF"
    warn "No --domain given, so the site answers on its IP address over plain HTTP."
    printf '        Once a domain points here:\n'
    printf '            sudo bash %s/enable-https.sh <domain> <email>\n' "$HERE"
fi

# ---------------------------------------------------------------------------
elapsed=$(( $(date +%s) - started ))
ip="$(public_ip)"

if (( https_done )); then
    url="https://${DOMAIN}"
else
    url="http://${ip}"
fi

printf '\n%s  Installed in %d min %d sec.%s\n\n' "$C_GOOD" $(( elapsed / 60 )) $(( elapsed % 60 )) "$C_OFF"
cat <<SUMMARY
    The application    ${url}
    Sign in as         admin@amaso.org  /  password     <- change this now
    Server IP          ${ip}

    Check on it later with:
        sudo bash ${HERE}/status.sh

SUMMARY

if [[ -z "$DOMAIN" ]]; then
cat <<DNS
    To put a domain on it, add these two records at your registrar,
    then run enable-https.sh:

        A      @      ${ip}
        CNAME  www    <your-domain>

DNS
fi
