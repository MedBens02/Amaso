# AMASO — Deploying to a server

This puts the application on a Linux VM so the association can reach it
from anywhere, rather than from one PC in the office.

For running it on a single Windows machine instead, see
[`../setup/README.md`](../setup/README.md).

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
built as a **static export** — 3.7 MB of HTML, JS and CSS that nginx serves
straight from disk. **There is no Node process running in production**; Node
is needed only at build time. That removes an entire long-running service
from the box, and with it the memory it would hold and the crash it could
have at 3am.

Serving both halves from one origin means the browser makes same-origin
requests, so there is no CORS configuration to get wrong and only one
hostname to certificate.

### Requirements

Modest. Three to five people, a database of a few megabytes, no uploads, no
background jobs.

| | |
|---|---|
| RAM | 1 GB works; 2 GB is comfortable |
| Disk | 10 GB |
| OS | Ubuntu 22.04 or 24.04 |

That fits inside the **always-free tier** at Oracle Cloud (4 ARM cores and
24 GB RAM, or an x86 micro instance), and inside the cheapest tier at
Hetzner, DigitalOcean, Vultr or Contabo (€4–6/month).

---

## Installing

### 1. Create the VM

Ubuntu 24.04. Add your SSH key. Open ports 22, 80 and 443 in the provider's
firewall — on Oracle Cloud that is a *security list* rule on the subnet, and
forgetting it is the single most common reason a correctly installed server
appears dead.

### 2. Prepare the server

```bash
ssh ubuntu@<server-ip>

sudo apt update && sudo apt install -y git
git clone https://github.com/MedBens02/Amaso.git /tmp/amaso-installer
cd /tmp/amaso-installer/deploy

sudo bash provision.sh
```

Installs nginx, PHP-FPM, MariaDB, Node and Composer, creates the database
and a user for it with a generated password, writes the nginx site and opens
the firewall. Five to ten minutes. Safe to re-run.

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

Optional but strongly recommended: without it, every password typed into the
application crosses the network in the clear.

A `.ma` domain costs about 100 MAD/year; `.org` about €12 at Namecheap,
Porkbun or Gandi. Point an **A record** at the server's IP, wait for it to
resolve, then:

```bash
sudo bash enable-https.sh amaso.exemple.ma admin@exemple.ma
```

Requests a free Let's Encrypt certificate, redirects HTTP to HTTPS, and
leaves a timer that renews it. The script checks the DNS first, because a
domain that does not yet resolve is the usual cause of a failed request —
and failures count against Let's Encrypt's rate limit.

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
rsync -avz ubuntu@<server-ip>:/var/backups/amaso/ ~/amaso-backups/
```

---

## Day to day

| | |
|---|---|
| Deploy an update | `sudo bash /var/www/amaso/deploy/deploy.sh` |
| Back up now | `sudo bash /var/www/amaso/deploy/backup.sh` |
| List backups | `sudo bash /var/www/amaso/deploy/backup.sh --list` |
| Restore one | `sudo bash /var/www/amaso/deploy/backup.sh --restore <file>` |
| Application log | `sudo tail -f /var/www/amaso/backend/storage/logs/laravel.log` |
| PHP errors | `sudo tail -f /var/log/php-fpm-amaso.log` |
| nginx errors | `sudo tail -f /var/log/nginx/amaso-error.log` |
| Restart everything | `sudo systemctl restart php8.3-fpm nginx mariadb` |

`deploy.sh` re-runs the whole build every time and applies only new
migrations. It never drops or rewrites existing rows, so it is safe to run
against live data. Take a backup first anyway.

A restore asks you to type the database name before it will overwrite
anything, and saves a copy of the current contents first — a restore is
usually done in a hurry, and "that was the wrong backup" is a bad place to
end up.

---

## When something is wrong

| Symptom | Where to look |
|---|---|
| The site does not load at all | The provider's firewall, not the server's. Oracle Cloud and AWS block 80/443 at the subnet by default |
| 502 Bad Gateway | PHP-FPM is down: `systemctl status php8.3-fpm`, then `/var/log/php-fpm-amaso.log` |
| Pages load, every API call fails | `sudo tail -50 /var/www/amaso/backend/storage/logs/laravel.log` |
| 404 on refresh of a deep link | The `try_files $uri $uri.html` line in the nginx site is missing or edited |
| Excel export returns 500 | `php -m \| grep gd` — the extension is missing |
| PDF export returns 500 | `sudo -u amaso php /var/www/amaso/backend/artisan view:clear` |
| Login says the credentials are wrong | `sudo -u amaso php artisan tinker` then `User::first()->update(['password' => Hash::make('newpassword')])` |
| Changes deployed but not visible | A stale cache: `config:clear`, then `config:cache` |

---

## Files here

| | |
|---|---|
| `provision.sh` | One-time server preparation |
| `deploy.sh` | Fetch, build and release — run for every update |
| `enable-https.sh` | Domain and Let's Encrypt certificate |
| `backup.sh` | Nightly dumps, listing and restore |
| `nginx.conf.template` | The site configuration `provision.sh` fills in |

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
written in cannot reach a container registry. Shipping untested
infrastructure to a project that has already been bitten repeatedly by
untested environment assumptions would repeat the mistake rather than fix
it. Everything in this folder was run against a real database.

If the day comes when this needs several instances, or a queue worker, or a
second service, containers start to earn their keep. Today they would only
add a layer between the association and a server they can already
understand.
