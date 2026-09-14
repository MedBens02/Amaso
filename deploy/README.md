# AMASO — Deploying to a server

This puts the application on a Linux VM so the association can reach it
from anywhere, rather than from one PC in the office.

For running it on a single Windows machine instead, see
[`../setup/README.md`](../setup/README.md).

---

## The short version

Create an Ubuntu 24.04 VM, point your domain's A record at its IP, then:

```bash
ssh ubuntu@<server-ip>          # root@ on providers that allow it

sudo apt update && sudo apt install -y git
sudo git clone https://github.com/MedBens02/Amaso.git /opt/amaso-installer
cd /opt/amaso-installer/deploy

sudo bash bootstrap.sh --check          # 15 seconds, changes nothing
sudo bash bootstrap.sh --domain amaso.exemple.ma --email admin@exemple.ma
```

That is the whole install: server packages, database, application, nightly
backups and an HTTPS certificate. Ten to twenty minutes, mostly waiting for
`apt` and the frontend build.

**Run `--check` first.** It looks at the release, the disk, the memory,
whether anything already holds port 80, and whether this machine can reach
GitHub, Packagist, Composer, NodeSource and npm. Every one of those has
stopped an install part way through at least once; fifteen seconds beforehand
is a much better place to find out than ten minutes in.

Leave off `--domain` and `--email` and it installs just the same, answering
on the server's IP over plain HTTP; run `enable-https.sh` later when a
domain is ready.

Everything it does is safe to re-run. If it stops part way — a mirror times
out, DNS has not propagated — fix the cause and run the same line again.

---

## What gets installed

```
                         ┌─────────────────────────────────┐
   browser  ──── 443 ───▶│  nginx                          │
                         │                                 │
                         │   /            → frontend/out   │  static files
                         │   /api/*       → PHP-FPM        │
                         └────────────────┬────────────────┘
                                          │  unix socket
                                          ▼
                                 ┌──────────────────┐
                                 │  Laravel         │
                                 │  (php-fpm pool)  │
                                 └────────┬─────────┘
                                          ▼
                                 ┌──────────────────┐
                                 │  MariaDB         │  localhost only
                                 └──────────────────┘
```

The frontend has no route handlers, middleware or server actions, so it is
built as a **static export** — 4.6 MB of HTML, JS and CSS that nginx serves
straight from disk. **There is no Node process running in production**; Node
is needed only at build time. That removes an entire long-running service
from the box, and with it the memory it would hold and the crash it could
have at 3am.

Serving both halves from one origin means the browser makes same-origin
requests, so there is no CORS configuration to get wrong and only one
hostname to certificate.

### Requirements

| | |
|---|---|
| RAM | **2 GB comfortable. 1 GB works, but only with swap** — see below |
| Disk | 15 GB |
| OS | **Ubuntu 24.04 LTS.** 22.04 works too (the scripts add the PHP 8.3 PPA) |

**The memory figure is about the build, not about running the site.**
Serving three to five people needs very little: nginx, a couple of PHP
workers and a database holding a few megabytes. But `next build` — which
runs once per deploy — was **measured at 1.34 GB peak resident** for this
application. On a 1 GB VPS with no swap the kernel kills it part way
through, and all you get is the word `Killed` and a missing
`frontend/out`.

`provision.sh` therefore creates a swapfile sized to bring RAM + swap up to
4 GB, and `deploy.sh` refuses to start a build that cannot fit, naming the
reason instead of dying halfway. On a 1 GB box the build takes a few
minutes longer and completes; the running site stays in RAM because
`vm.swappiness` is set to 10.

**Pick the LTS, and pick the plain image.** The scripts ask apt which PHP
the release offers rather than assuming, so a newer Ubuntu will usually
work - but 24.04 is the one this has actually been installed on end to end,
and a release newer than the PHP ecosystem can be genuinely stuck: when
26.04 was tried, neither the release nor the ondrej PPA had packages for it.
Avoid images that ship their own control panel; they hold port 80 and fight
nginx for it.

### On Hostinger specifically

Any of the KVM plans work. **KVM 2** (2 vCPU, 8 GB) is more than enough and
removes all doubt; **KVM 1** (1 vCPU, 4 GB) is plenty too. Even a 1 GB plan
would work with the swap these scripts create, but the build is noticeably
slower.

- Choose the **plain Ubuntu 24.04** template, not one of the panel images
  (no cPanel, no CyberPanel, no Docker template). Those ship their own
  nginx or Apache on port 80 and these scripts would fight them.
- Add your SSH key during creation rather than using a root password.
- Hostinger's VPS firewall is **off by default**, so ports 80 and 443 are
  already reachable; there is no subnet rule to add the way there is on
  Oracle Cloud or AWS. If you do turn their firewall on, allow 22, 80
  and 443.
- The IP is on the VPS overview page. That is the address the domain's
  A record needs.

---

## Before you deploy: which branch?

`deploy.sh` deploys the repository's **default branch** — it asks the remote
rather than assuming a name, but it will not guess that your work is
somewhere else.

So merge first. If your latest work is on a feature branch and you deploy
without merging, the server installs cleanly and runs an older version of
the application, which is a confusing thing to debug.

To deploy a branch on purpose:

```bash
sudo BRANCH=my-branch bash deploy.sh
```

---

## The steps, if you would rather run them yourself

`bootstrap.sh` runs exactly these, in this order.

### 1. Create the VM

Ubuntu 24.04, your SSH key, ports 22/80/443 reachable.

### 2. Prepare the server

```bash
sudo bash provision.sh
```

Installs nginx, PHP-FPM, MariaDB, Node and Composer; creates the database
and a user for it with a generated password (saved to
`/root/.amaso-db-password`); sizes swap and the PHP worker pool to the
machine it finds; turns on automatic security updates and fail2ban; writes
the nginx site and opens the firewall. Five to ten minutes. Safe to re-run.

### 3. Deploy the application

```bash
sudo bash deploy.sh https://github.com/MedBens02/Amaso.git
```

Fetches the code into `/var/www/amaso`, installs dependencies, builds the
frontend, creates the schema, and checks that both the pages and the API
answer before it reports success.

Open `http://<server-ip>`. Sign in as `admin@amaso.org` / `password`, then
**change that password immediately** under Paramètres → Gestion des comptes.

### 4. Add a domain and HTTPS

Without it, every password typed into the application crosses the network
in the clear.

A `.ma` domain costs about 100 MAD/year; `.org` about €12 at Namecheap,
Porkbun or Gandi. Point an **A record** at the server's IP, wait for it to
resolve, then:

```bash
sudo bash enable-https.sh amaso.exemple.ma admin@exemple.ma
```

Requests a free Let's Encrypt certificate, redirects HTTP to HTTPS, turns on
HSTS and leaves a timer that renews it. If `www.` also points here it goes
on the certificate too — pass `--no-www` to skip that.

The script checks the DNS first, because a domain that does not yet resolve
is the usual cause of a failed request — and failures count against Let's
Encrypt's rate limit.

### 5. Schedule backups

```bash
sudo bash backup.sh --install-cron
```

A gzipped dump into `/var/backups/amaso` at 02:30 each night, keeping the
last 30. A few megabytes each.

**A backup on the same machine as the database is not a backup against
losing the machine.** Copy them somewhere else as well — from your own
computer:

```bash
rsync -avz root@<server-ip>:/var/backups/amaso/ ~/amaso-backups/
```

---

## Keeping strangers out

By default anyone who finds the address reaches the login page. On a server
the team is trying out, or one you would rather nobody probed, put a gate in
front of it:

```bash
# a shared password, generated and printed once
sudo bash restrict-access.sh --password

# or only these addresses - airtight, but they must be stable
sudo bash restrict-access.sh --ip 41.248.10.20 --ip 196.65.4.7

# or both: the office walks in, everyone else is asked for the password
sudo bash restrict-access.sh --password --ip 41.248.10.20

sudo bash restrict-access.sh --status
sudo bash restrict-access.sh --off
```

Everyone gets a browser password prompt before they see anything. Let's
Encrypt keeps working — the challenge path is exempted — and the pages carry
`X-Robots-Tag: noindex` so the server never turns up in a search.

**One thing worth knowing about the password option.** HTTP carries a single
`Authorization` header, and both halves want it: the browser fills it with
the gate's Basic credentials, and the application overwrites it with its own
Bearer token. Gate `/api` with a password and every API call is rejected by
nginx, which the application reads as an expired session — it bounces to the
login page and stays there. So `restrict-access.sh` lifts the password gate
on `/api` and leaves that path to Laravel's own token authentication, which
returns 401 to anyone without a valid token.

An address allowlist has no such conflict, so when that is the only gate it
covers the API too. If the team's addresses are stable, `--ip` is the
stronger choice.

---

## DNS records

Two records at your registrar, once:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | the server's IP |
| `CNAME` | `www` | `exemple.ma` |

Propagation is usually minutes, occasionally an hour. Check with
`getent hosts exemple.ma` on the server — when that prints the server's own
IP, run `enable-https.sh`.

If you put Cloudflare in front with its proxy on (the orange cloud), the
domain will resolve to Cloudflare rather than to the server;
`enable-https.sh` notices and asks whether to continue, which is the right
answer in that case. Note that the audit log will then record Cloudflare's
address as the client IP rather than the real one.

---

## Updating a running server

```bash
sudo bash /var/www/amaso/deploy/deploy.sh
```

That is the whole update. It fetches the branch the server is on, resets to
it, reinstalls dependencies, applies any new migrations, rebuilds the
frontend, rebuilds the caches and reloads nginx and PHP-FPM — then checks
that the pages and the API answer before reporting success.

**It does not touch your data.** `migrate --force` only adds structure; it
never drops or rewrites rows. The demo seeder is not run unless `--demo` is
passed, and it refuses to run into a database that already holds families.

Take a backup first anyway — it costs a second:

```bash
sudo bash /var/www/amaso/deploy/backup.sh
sudo bash /var/www/amaso/deploy/deploy.sh
sudo bash /var/www/amaso/deploy/status.sh
```

The server follows its branch, so **merge before you deploy**. To move a
server onto a different branch, name it once and it stays there:

```bash
sudo BRANCH=some-branch bash /var/www/amaso/deploy/deploy.sh
```

Expect two to five minutes, nearly all of it the frontend build. The site
stays up throughout: nginx keeps serving the previous `frontend/out` until
the new one is written, and the reload at the end is graceful.

If it fails part way, run it again. Every step is safe to repeat.

### If an update goes wrong

The previous version is a commit away:

```bash
cd /var/www/amaso
sudo -u amaso git log --oneline -5              # find the one that worked
sudo BRANCH=<that-commit-or-branch> bash deploy/deploy.sh
```

A migration that has already run is not undone by checking out older code.
If the schema moved and you need to go back, restore the backup you took
before the update:

```bash
sudo bash /var/www/amaso/deploy/backup.sh --list
sudo bash /var/www/amaso/deploy/backup.sh --restore /var/backups/amaso/<file>.sql.gz
```

---

## Day to day

| | |
|---|---|
| Check everything | `sudo bash /var/www/amaso/deploy/status.sh` |
| Gate the site | `sudo bash /var/www/amaso/deploy/restrict-access.sh --password` |
| Deploy an update | `sudo bash /var/www/amaso/deploy/deploy.sh` |
| Back up now | `sudo bash /var/www/amaso/deploy/backup.sh` |
| List backups | `sudo bash /var/www/amaso/deploy/backup.sh --list` |
| Restore one | `sudo bash /var/www/amaso/deploy/backup.sh --restore <file>` |
| Application log | `sudo tail -f /var/www/amaso/backend/storage/logs/laravel.log` |
| PHP errors | `sudo tail -f /var/log/php-fpm-amaso.log` |
| nginx errors | `sudo tail -f /var/log/nginx/amaso-error.log` |
| Restart everything | `sudo systemctl restart php8.3-fpm nginx mariadb` |

`status.sh` is the one to reach for first. It reports every service, the
deployed version, whether the pages and the API answer, the row counts in
the database, how old the last backup is, how long the certificate has
left, and whether there is enough memory for the next build — and exits
non-zero if any of it is wrong, so it also works from cron.

`deploy.sh` re-runs the whole build every time and applies only new
migrations. It never drops or rewrites existing rows, so it is safe to run
against live data. Take a backup first anyway.

A restore asks you to type the database name before it will overwrite
anything, and saves a copy of the current contents first — a restore is
usually done in a hurry, and "that was the wrong backup" is a bad place to
end up.

---

## When something is wrong

Every row below is something that actually happened during a real install,
not a list of things that might.

| Symptom | Cause and fix |
|---|---|
| Anything at all | `sudo bash /var/www/amaso/deploy/status.sh` first — it names the failing part |
| Pages 403, API works | nginx cannot traverse the app directory: `sudo chmod 755 /var/www/amaso`. Fixed in `provision.sh`; this is the one-line repair for a server built before it |
| The deploy printed `Killed` during the build | Out of memory. `free -m` — if swap is 0, re-run `provision.sh` |
| Stuck at `Installing Composer`, no output | An old copy of the scripts. Composer asks to continue as root and the question is invisible; press Enter, or re-clone the installer |
| `429` during `composer install` | GitHub rate-limits downloads per IP and cloud IPs are shared. It retries and falls back on its own; to skip the wait: `sudo env GITHUB_TOKEN=ghp_... bash deploy.sh` |
| `does not have a Release file` for ondrej/php | The release is newer than the PPA. Use Ubuntu 24.04, or `sudo PHP_VERSION=8.3 bash provision.sh` |
| `vendor/autoload.php` not found during deploy | An old copy of the scripts — key generation ran before Composer. Re-clone the installer and run it again |
| `enable-https.sh` exits with no message | An old copy. A domain that does not resolve used to end the script silently |
| The site does not load at all | The provider's firewall, not the server's. Oracle Cloud and AWS block 80/443 at the subnet by default; Hostinger does not |
| 502 Bad Gateway | PHP-FPM is down: `systemctl status php8.3-fpm`, then `/var/log/php-fpm-amaso.log` |
| Pages load, every API call fails | `sudo tail -50 /var/www/amaso/backend/storage/logs/laravel.log` |
| Migrations fail with "Access denied for user 'root'" | `backend/.env` has no database credentials. Delete it and re-run `deploy.sh` |
| 404 on refresh of a deep link | The `try_files $uri $uri.html` line in the nginx site is missing or edited |
| Excel export returns 500 | `php -m \| grep gd` — the extension is missing |
| PDF export returns 500 | `sudo -u amaso php /var/www/amaso/backend/artisan view:clear` |
| Login says the credentials are wrong | `sudo -u amaso php artisan tinker` then `User::first()->update(['password' => Hash::make('newpassword')])` |
| Changes deployed but not visible | A stale cache: `config:clear`, then `config:cache` |
| The deployed version is older than expected | `deploy.sh` took the repository's default branch. Merge, or set `BRANCH=` |

---

## Files here

| | |
|---|---|
| `bootstrap.sh` | **Start here** — `--check` to test the machine, then the whole install in one command |
| `provision.sh` | One-time server preparation |
| `deploy.sh` | Fetch, build and release — run for every update |
| `enable-https.sh` | Domain and Let's Encrypt certificate |
| `backup.sh` | Nightly dumps, listing and restore |
| `restrict-access.sh` | A password or address gate in front of the whole site |
| `status.sh` | What is running, what is broken, what needs attention |
| `common.sh` | Shared helpers, sourced by the rest |
| `nginx.conf.template` | The site configuration `provision.sh` fills in |

---

## What is hardened, and what is not

Done by `provision.sh`:

- The application runs as its own unprivileged user, not `www-data`, so a
  compromise of anything else on the box does not reach these records.
- MariaDB listens on localhost only; its password is generated, stored at
  `/root/.amaso-db-password` with mode 600, and never appears in a command
  line where `ps` would show it.
- Anonymous MariaDB accounts and the world-writable `test` database are
  removed.
- Security updates install themselves (`unattended-upgrades`).
- fail2ban bans an IP for an hour after five failed SSH logins.
- Logs rotate, so the disk does not fill quietly a year from now.
- `enable-https.sh` adds HSTS once the certificate works — never before,
  because HSTS on a broken certificate locks visitors out.

Not done, and deliberately left to you:

- **SSH keys only.** Set `PasswordAuthentication no` in
  `/etc/ssh/sshd_config` once you have confirmed your key works.
- **Off-site backups.** The nightly dump protects against a mistake, not
  against losing the machine. See the `rsync` line above.
- **Changing the seeded passwords.** `admin@amaso.org` / `password` is a
  published default. Change it before the application holds anything real.

---

## How these scripts are tested, and what that missed

Worth knowing, because it explains the shape of the troubleshooting table
above.

What is verified here, against real software: the nginx configuration is
rendered and checked with `nginx -t`, including the path taken on a host
without IPv6; the generated `.env` is read back with Laravel's own dotenv
parser; `provision.sh`'s SQL runs against MariaDB 10.11 and the resulting
credentials migrate and seed an empty database; `backup.sh` runs against a
real database including retention and both restore paths; and the access
gate was driven with a browser against the production build, which is how
the Authorization-header conflict with `/api` was found.

What that could not cover is a genuinely empty Ubuntu server. No container
registry is reachable from where these were written, so the first real run
was on the association's own VM - and it found ten faults that reading,
`bash -n` and testing against an already-working machine had all passed
over: a quote inside `${var:-default}` that made the parser rebalance
tokens silently, a release-number guess, two commands with no timeout, a
prompt hidden inside a command substitution, a step in the wrong order,
GitHub's rate limit, a web root nginx could not enter, a pipeline killed by
SIGPIPE, and a password printed after the step that could lose it.

They are all fixed, and each fix is a comment in the script explaining what
the failure looked like. The lesson worth carrying: `bash -n` parses, it
does not expand - it cannot see a quoting fault that rebalances later in the
file, a race against an endless pipe, or two steps in the wrong order. The
`--check` mode exists because of this, and so does the habit of running the
setup section of a script rather than only parsing it.

---

## Why there is no Dockerfile

The obvious question, and the answer is: it would add work without removing
any of this project's actual problems.

**The drift Docker fixes is already fixed.** Every environment failure this
project has hit came from something missing on a fresh checkout, and each
has been closed at the source: `composer.lock` is committed, `composer.json`
pins `config.platform.php`, the `storage/framework` placeholders are
tracked, and `ext-gd` is checked by `install.bat` and installed by
`provision.sh`. A container would have hidden those bugs rather than fixed
them — and they would still have been there for anyone not using it.

**It would make the Windows machine harder, not easier.** Docker Desktop
needs WSL2 and virtualization enabled in the BIOS. On an association's
office PC that is a real obstacle with no fallback, where XAMPP simply
installs.

**There is very little to orchestrate.** No queue worker, no cache server,
no object storage, no Node process. It is a web server, PHP and a database —
three packages, installed once by a script that can be read and edited on
the server without rebuilding anything.

**And it could not have been tested.** The environment these scripts were
written in cannot reach a container registry — the image pull is blocked at
the proxy, which was confirmed rather than assumed. Shipping untested
infrastructure to a project already bitten repeatedly by untested
environment assumptions would repeat the mistake rather than fix it. See the
section above for what was tested and what it missed.

If the day comes when this needs several instances, or a queue worker, or a
second service, containers start to earn their keep. Today they would only
add a layer between the association and a server they can already
understand.
