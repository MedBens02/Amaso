# ترقية نظام AMASO — AMASO upgrade

How to take the server the association is running today to this version,
keeping every record it already holds.

**Nothing here reseeds the database.** The upgrade adds tables and columns to
the data that is already there. The one command that could seed only runs when
the `users` table is empty, which on a running server it is not.

---

## Before anything: what is on the server now

The deployed version's last migration is
`2025_09_19_000001_promote_existing_admins_to_superuser`. Check it:

```bash
cd /opt/amaso/backend        # or wherever the application lives
php artisan migrate:status | tail -5
```

If the last line you see is that one, this document applies as written. If it
is something later, somebody has deployed since — run `migrate:status` against
this branch and skip the migrations already marked `Ran`; the commands below
are safe either way, because `migrate` only applies what is missing.

---

## 1. Take a backup, and keep it where you can find it

```bash
cd /opt/amaso/deploy
sudo bash backup.sh
sudo bash backup.sh --list
```

Do not skip this. One migration in this release **deletes two columns** after
copying what they held into a new table (see §6). It is tested and it works,
but a column that is gone is gone, and restoring from last night's backup is a
worse morning than restoring from one taken two minutes earlier.

---

## 2. Set up email — do this before deploying

Signing in now takes two steps: the password, then a six-digit code sent to the
address on the account. **If the server cannot send mail, that code cannot
arrive.**

The server is currently running `MAIL_MAILER=log`, which writes email to
`storage/logs/laravel.log` instead of sending it. The upgrade handles this
safely on its own — it leaves the code requirement **off** for every existing
account and prints a notice saying so — so a server with no mail settings will
not lock anybody out. But then the second step is simply not protecting
anything, which is the point of the release.

So: set the mail settings first, and the upgrade switches everybody on by
itself.

Edit `/opt/amaso/backend/.env`. The association's own mailbox is the right
sender — the address staff see matches the domain the system runs on:

```ini
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_SCHEME=smtps
MAIL_USERNAME=system@amaso.site
MAIL_PASSWORD=<the mailbox password>
MAIL_FROM_ADDRESS=system@amaso.site
MAIL_FROM_NAME="جمعية المنصور لكفالة اليتيم"
```

`MAIL_FROM_ADDRESS` must be the same mailbox as `MAIL_USERNAME` — a mail
server rejects a message claiming to come from an address the sender did
not authenticate as.

Gmail works too, if that is what the association already uses. There
`MAIL_HOST=smtp.gmail.com`, `MAIL_PORT=587`, `MAIL_SCHEME=null`, and
`MAIL_PASSWORD` is a **16-character Google app password**, not the account
password — Google only offers app passwords once 2-Step Verification is on
for that account.

`backend/.env.example` carries both blocks in full, with the caveats.

Prove it works before going further:

```bash
cd /opt/amaso/backend
php artisan config:clear
php artisan amaso:mail-test votre-adresse@gmail.com
```

A real email should arrive within a minute. If it does not, fix that now —
everything after this depends on it. The command prints the SMTP error and
exits non-zero, so it is safe to put in a script.

---

## 3. Deploy

### On the Linux server

```bash
cd /opt/amaso/deploy
sudo BRANCH=claude/charity-project-recap-evybxh bash deploy.sh
```

Drop the `BRANCH=` once this branch is merged into `master`; then it is just
`sudo bash deploy.sh`.

That one command does all of it: fetch the code, `composer install`, build the
frontend, `php artisan migrate --force`, rebuild the caches, reload nginx and
PHP-FPM. It prints each step and stops on the first failure.

### On the Windows machine

```bat
cd C:\Amaso\setup
update-app.bat
```

It stops the application, pulls, installs the PHP and JavaScript dependencies,
runs `php artisan migrate --force`, and starts it again. Local edits are
stashed and restored around the pull.

### By hand, if you would rather see each step

```bash
cd /opt/amaso
git fetch origin claude/charity-project-recap-evybxh
git reset --hard origin/claude/charity-project-recap-evybxh

cd backend
composer install --no-dev --optimize-autoloader
php artisan migrate --force          # adds only; never reseeds
php artisan config:clear && php artisan config:cache
php artisan route:cache && php artisan view:cache

cd ../frontend
npm ci
npm run build                        # writes frontend/out, served by nginx

# The PHP version differs between servers, so ask rather than guess:
sudo systemctl reload "$(systemctl list-units --type=service --plain --no-legend \
    'php*-fpm.service' | awk '{print $1}' | head -1)" nginx
```

---

## 4. Switch the login code on

If mail was already configured in §2, the upgrade did this for you and you can
skip to §5. Check either way:

```bash
cd /opt/amaso/backend
php artisan amaso:two-factor
```

It lists every account and whether the code is required. If the column says
`OFF` and mail now works:

```bash
php artisan amaso:two-factor --all --on
```

**Test it before you close the SSH session.** Open the site in a private
browser window and sign in. If the code does not arrive, you still have a shell
open, and this puts it back:

```bash
php artisan amaso:two-factor --all --off
```

---

## 5. Check it worked

```bash
cd /opt/amaso/backend
php artisan migrate:status | tail -12      # eleven new lines, all "Ran"
php artisan amaso:password-policy          # 30 days, 10-minute codes, who is due
cd ../deploy && sudo bash status.sh        # services, disk, certificate
```

Then in a browser:

1. Sign in. You should be asked for a code, and it should arrive.
2. Open **الأرامل** — the families are all still there, with their sponsors.
3. Open **التعليم ← التسجيلات** — marks are intact and the year average is shown.
4. Open **إدارة الحسابات** — every account shows **التحقق بخطوتين: مُفعّل**.
5. Open **المالية ← المصروفات**, start a new expense, pick the fund **عدّة** —
   only عدة families are offered. Pick any other fund and they are not.

Counts before and after should be identical:

```bash
php artisan tinker --execute '
  printf("widows %d, orphans %d, incomes %d, expenses %d, enrollments %d\n",
    App\Models\Widow::count(), App\Models\Orphan::count(),
    App\Models\Income::count(), App\Models\Expense::count(),
    App\Models\OrphanEnrollment::count());'
```

---

## 6. What the upgrade changes in the database

Eleven migrations, in order. Everything is additive except where noted.

| Migration | What it does |
|---|---|
| `2025_09_19_000002_remove_hut_housing_type` | Moves families recorded as كوخ to شقة, then deletes that housing type |
| `2025_09_21_000001_retire_two_housing_types` | Same for بيت شعبي → غرفة |
| `2025_09_21_000002_add_national_id_to_donors` | `donors.national_id` (CIN) |
| `2025_09_21_000003_create_sectors_and_neighborhoods` | `sectors`, `neighborhoods`; existing neighbourhood text is kept |
| `2025_09_22_000001_create_enrollment_grades_table` | `enrollment_grades` — one row per exam mark |
| `2025_09_22_000002_count_bus_trips_per_rider` | Trip count on each bus rider, so the fare follows actual use |
| `2025_09_23_000001_…grade_components_table` | `education_level_grade_components`, seeded الأسدس الأول 50 / الأسدس الثاني 50 for every level |
| `2025_09_23_000002_weight_enrollment_grades…` | **Copies `first_semester_grade` and `second_semester_grade` into `enrollment_grades` rows, then drops both columns.** The only destructive step in the release |
| `2025_09_24_000001_add_idda_support_to_widows` | `husband_death_date`, `idda_end_date`, `is_idda_case`; the عدّة fund; the monthly amount as a setting (400 د.م.) |
| `2025_09_24_000002_attach_categories_to_budgets` | `budget_income_category`, `budget_expense_category`, filled from the existing categories |
| `2025_09_25_000001_add_login_codes_and_password_age` | `login_codes`; `users.two_factor_enabled` and `users.password_changed_at`; the password age and code lifetime as settings |

About that destructive one: the two semester marks are read out, written into
`enrollment_grades` at weight 50 each, and only then are the columns dropped.
Every mark that was on screen before the upgrade is on screen after it, under
**المعدل**. But the old columns no longer exist, so **going back to the
previous release after this migration has run needs the database restored from
the backup in §1** — the old code reads columns that are gone.

Nothing else in the list is one-way. Everything before it either adds
structure or rewrites reference rows that the application itself can edit.

---

## 7. Two new rules the association will notice

**Passwords expire after 30 days.** Five days before, a band appears across the
top of the screen. On the day, the person is asked to choose a new one before
they can carry on; they can also sign out from that screen instead. Nobody is
expired on the day you deploy — the clock starts at the upgrade, so everyone
gets a full first period.

An administrator resetting somebody's password from **إدارة الحسابات** also
requires a change at the next sign-in, since the owner did not choose that one.

To change the period, or turn expiry off:

```bash
php artisan amaso:password-policy --days=60
php artisan amaso:password-policy --days=0     # off
php artisan amaso:password-policy --code-minutes=15
```

**Signing in takes two steps.** Password, then a six-digit code from the
inbox. The code lasts ten minutes, works once, and dies after five wrong
guesses — at which point the person asks for another from the same screen.
Asking again invalidates the previous one, so the newest email is always the
one that works.

---

## 8. If something goes wrong

**Nobody can sign in.** Almost always the mail settings. From the server:

```bash
cd /opt/amaso/backend
php artisan amaso:mail-test you@example.com     # see the actual SMTP error
php artisan amaso:two-factor --all --off        # password-only, while you fix it
```

Shell access to the server is already the highest level of trust there is, so
this grants nothing that was not already granted.

**One person cannot sign in** — their address has a problem, not the server's.
An administrator can switch the code off for that account alone from **إدارة
الحسابات** → the row menu → **تعطيل التحقق بخطوتين**, and switch it back when
the address works again.

**Somebody is stuck on the change-password screen.** They can sign out from it.
An administrator resetting their password does not help — a reset also requires
a change. Either they choose a new password, or turn expiry off for everyone
with `amaso:password-policy --days=0` while you work out what is wrong.

**The deploy failed part way.** Everything in `deploy.sh` is safe to run again.
Fix the cause and run the same line; it will skip what is already done.

**Put it all back.** Only if a migration genuinely damaged something:

```bash
cd /opt/amaso/deploy
sudo bash backup.sh --list
sudo bash backup.sh --restore /var/backups/amaso/<the file>.sql.gz

cd /opt/amaso
git reset --hard <the commit that was deployed before>
cd backend && composer install --no-dev --optimize-autoloader
cd ../frontend && npm ci && npm run build
sudo systemctl reload "$(systemctl list-units --type=service --plain --no-legend \
    'php*-fpm.service' | awk '{print $1}' | head -1)" nginx
```

`backup.sh --restore` takes its own safety copy first, before overwriting
anything — so restoring the wrong file is recoverable too.
