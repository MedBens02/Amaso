# AMASO — handover for the next developer

Written for somebody picking this up cold. It covers what the system is,
how it is put together, the domain you have to understand before you can
change anything safely, and the things that will bite you.

It does not repeat the setup instructions. Those are
[`../SETUP_GUIDE.md`](../SETUP_GUIDE.md).

---

## 1. What it is, and who uses it

A management system for **جمعية المنصور لكفالة اليتيم** — the Al Mansour
Association for Orphan Sponsorship, in Morocco. It replaced a set of
spreadsheets.

Three or four people use it, in an office, in Arabic. They are not
technical. They are responsible for the association's entire beneficiary
register and its books, and the records are about real, identifiable,
vulnerable families — around 150 widowed women and 370 children, with
national identity numbers, addresses, health notes and money.

Two things follow from that, and they run through the whole codebase:

- **The interface is Arabic and right-to-left.** Not localised — written
  that way. Strings are Arabic literals in the components. There is no
  translation layer and no second language.
- **Being wrong is worse than being slow.** A report that quietly
  understates what a family received is a worse failure than a page that
  takes an extra second. Much of the code that looks over-careful is
  over-careful on purpose, and the comments say why.

### Scale

| | |
|---|---|
| Database tables | 63 |
| Migrations | 75 |
| Eloquent models | 49 |
| API controllers | 23 |
| Service classes | 18 |
| Frontend pages | 26 |
| React components | 161 |

---

## 2. The stack, and why

```
  Next.js 15  ──build──▶  static files  ──┐
  (React 18, TypeScript, Tailwind,        │
   shadcn/ui, RTL)                        ├──▶  nginx  ──▶  browser
                                          │
  Laravel 12 (PHP 8.2) ── PHP-FPM ────────┘
          │
          ▼
      MariaDB
```

**The frontend is a static export.** `next build` with `BUILD_STATIC=1`
produces plain files in `frontend/out`, which nginx serves. No Node process
runs in production. The browser talks to `/api/v1/...` on the same origin,
which nginx proxies to PHP-FPM.

Consequences worth knowing before you write anything:

- **No server-side rendering, no API routes, no server actions, no
  middleware.** Everything is client-side. `"use client"` is at the top of
  nearly every file.
- **`next.config.mjs` rewrites do not apply in production.** They proxy
  `/api` under `next dev` only. In production nginx does it. Test anything
  touching the API against the built export, not just the dev server — this
  has caused a real bug before.
- Authentication is a **Laravel Sanctum bearer token** in `localStorage`,
  attached by `lib/api.ts`. Not cookies, not sessions.

---

## 3. Where things live

```
backend/
  app/Models/              49 Eloquent models
  app/Http/Controllers/Api/V1/    the API surface
  app/Http/Requests/V1/    validation — the business rules about input
  app/Services/            the business rules about behaviour  ◀ read these
  app/Support/             small shared helpers with one job each
  app/Console/Commands/    amaso:* operational commands
  database/migrations/     75, in order; they are the schema's history
  database/seeders/        reference data + DemoDataSeeder (opt-in)
  routes/api.php           every route, one file, grouped by area

frontend/
  app/dashboard/…          one folder per screen, page.tsx each
  components/<area>/       the screens' own components
  components/ui/           shadcn/ui primitives, several locally modified ◀
  lib/api.ts               the single API client. Everything goes through it
  hooks/

deploy/                    the VM install and update scripts
setup/                     the Windows single-machine install (French)
docs/                      this folder
```

**`app/Services/` is where to look first.** Controllers validate and
delegate; the rules that matter — money, settlement, closing a year — live
in services, under lock, in transactions.

**`components/ui/` is not stock shadcn.** `select.tsx`, `date-field.tsx`
and others carry local behaviour that the application depends on. Do not
regenerate them from upstream without reading them.

---

## 4. The domain

You cannot change this code safely without these. Terms are in
[`GLOSSARY.md`](GLOSSARY.md); the concepts are here.

### Families and children

A **widow** (`widows`) is the head of a beneficiary family. Her children
are **orphans** (`orphans`). Almost everything hangs off the family.
Archiving uses soft deletes — a family that leaves keeps its history, and
most queries must exclude `deleted_at` while history must not.

### Sponsorship (kafala)

A **kafil** is a sponsor who funds a family, through `kafil_sponsorship`
with a monthly amount. A family's **coverage** is what her sponsors pledge
against what she needs; the gap is what the shortfall report is about.

### Kafala chamila

A single donation split across several purposes by fixed percentages
(`kafala_chamila_splits`) — management, education, health and so on. The
percentages are editable, must total 100, and **rows already used by posted
money are locked**. Splitting is in `KafalaChamilaService`.

### عدة (idda) — "يتيم جديد" cases

A newly widowed woman in her waiting period. The association supports her
through it at a fixed monthly amount before deciding whether to take the
family on permanently. These families are **deliberately invisible**: kept
out of every list, count and report, and spendable against only from the
عدة budget. `Widow::scopeRegular()` and `scopeIddaCases()` enforce the
split — **if you add a query over widows, you must pick one.** Forgetting
puts عدة families into the association's published figures.

### Money

Income and expenses post against a **budget** and a **category**, and
against a **fiscal year**. Nothing counts until it is **approved**: drafts
are excluded from balances and reports, and only admins and accountants can
approve. Approving moves money against a **bank account** under a row lock.
A **closed fiscal year** refuses new postings.

Read [`../FINANCIAL-INTEGRITY.md`](../FINANCIAL-INTEGRITY.md) before
touching any of it. It is a working document rather than polished
reference, but it records why the money code is shaped as it is.

### Education

Enrollments per academic year. Marks are rows in `enrollment_grades`, each
with a **weight**; a level's scheme lives in
`education_level_grade_components`. The year average is weighted, computed
in percentage space so levels on different scales can be mixed. Default is
two semesters at 50 each; a baccalaureate year can weight a final exam at
75.

### Transport

One bus. Each month is a **sheet** (`transport_months`) with a line per
rider. Costs are divided **pro rata by trips actually made**, to the
centime, by largest remainder. Two rules that have each caused a bug:

- **Server and client must allocate leftover centimes in the same order**
  (both sort by id), or the preview and the saved figure disagree by a
  centime.
- **A settled month is frozen.** Its rows are a snapshot, they are skipped
  when rows are rebuilt, and the inputs are disabled. Rider records are
  edited on their own screen, not on the sheet, for exactly this reason.

---

## 5. Conventions actually used here

- **Comments explain why, not what.** The codebase is heavily commented and
  the comments carry the reasoning — including what was tried and rejected.
  Match that. A comment restating the code is noise; the reason a rule
  exists is the thing a future reader cannot recover.
- **Dates are dd/mm/yyyy everywhere**, through `components/ui/date-field.tsx`.
  Never `<input type="date">` directly: it renders in the *browser's*
  locale, so an English Chrome shows 09/19/2026 on an Arabic form. Use
  `toDisplay()` for dates shown outside a field.
- **One source of truth per fact.** A recurring cleanup in this repo has
  been deleting the second copy of something that then drifted — a
  duplicated type, a second date formatter, a filter re-implemented per
  form.
- **Roles:** `superuser`, `admin`, `accountant`, `social_worker`. Enforced
  by `EnsureUserHasRole` middleware on routes, not in the UI.
- **Every write is audited** by an observer into `audit_logs`. Seeders
  disable it (`AuditLogger::disable()`) so demo data does not bury real
  activity.

---

## 6. Testing — read this honestly

**There is no automated test suite.** `tests/` contains Laravel's two
example files and nothing else. No PHPUnit suite, no Playwright suite in
the repo, no CI.

Verification has been done by **writing a throwaway script per change** —
a Python script driving the live API, or a Playwright script driving a real
browser — running it, and reading the output. That has caught a lot of real
bugs, including several the code looked correct for. But it leaves nothing
behind, so nothing guards against regressions.

**If you are taking this on for more than a small change, the highest-value
thing you can add is a test suite**, starting with:

1. The money paths — approving, splitting kafala chamila, closing a year.
2. The عدة scoping, which is a single forgotten `scopeRegular()` away from
   leaking families into reports.
3. The transport pro-rata split, where the centimes are the whole point.

Until then, verify changes by driving the real thing, and prefer a
measurement over a reading of the code.

---

## 7. Things that will bite you

Each of these has actually happened.

| | |
|---|---|
| **The frontend build needs 1.4 GB.** | It is built on the server during deployment. A 1 GB machine kills it halfway. `deploy.sh` refuses to start without 2400 MB of RAM + swap. |
| **Two firewalls.** | Cloud security group *and* host iptables. Provider Ubuntu images reject 80/443 in iptables regardless of the cloud rule. |
| **A stale `frontend/out` is invisible.** | nginx serves whatever is there. If the build did not run, the API is new and the browser is old, and the symptom is a login that bounces back to the login page with nothing in any log. `status.sh` now reports it. |
| **Mail is required to sign in.** | No mail, no login codes, no access. Configure it before anyone needs it; `amaso:two-factor --all --off` is the way back in. |
| **A data-seeding migration runs before every seeder.** | On a fresh install it finds empty tables and seeds nothing. The pattern here is one idempotent method called from *both* the migration and the seeder. This trap has been hit three times. |
| **`Setting::all_values()` is cached forever.** | A migration writing settings through the query builder must call `Setting::forget()`. |
| **Carbon 3 `diffInMonths`/`diffInDays` return floats.** | Not ints. This mispriced an allowance once. |
| **`json_encode([])` is `[]`, not `{}`.** | A map-shaped response flips to a list when empty. Cast to `(object)`. |
| **Soft deletes leak.** | `whereHas()` on a relation with `withTrashed()` includes deleted rows. Pickers must exclude archived families; history must not. |

---

## 8. Operational commands

```bash
php artisan amaso:mail-test you@example.com    # prove mail works
php artisan amaso:two-factor                   # list accounts and their 2FA
php artisan amaso:two-factor --all --off       # break glass: password-only
php artisan amaso:password-policy --days=60    # change the expiry
php artisan amaso:finance-reconcile            # check the books against themselves
```

---

## 9. The rest of the documentation

| | |
|---|---|
| [`INFRASTRUCTURE.md`](INFRASTRUCTURE.md) | What the server needs. For a hosting provider. |
| [`GLOSSARY.md`](GLOSSARY.md) | The Arabic domain terms, and what they mean. |
| [`DATA-MODEL.md`](DATA-MODEL.md) | The 63 tables, drawn. Start here before a migration. |
| [`../SETUP_GUIDE.md`](../SETUP_GUIDE.md) | Getting it running locally. |
| [`../deploy/README.md`](../deploy/README.md) | Installing on a server. |
| [`../deploy/OCI.md`](../deploy/OCI.md) | Oracle Cloud, Casablanca region specifically. |
| [`../UPGRADE.md`](../UPGRADE.md) | Updating a running server; resetting data while keeping accounts. |
| [`../REPORTS.md`](../REPORTS.md) | How the reporting layer is built. |
| [`../FINANCIAL-INTEGRITY.md`](../FINANCIAL-INTEGRITY.md) | Working notes on the money model. Historical in places, still the best explanation of why. |
| [`../setup/README.md`](../setup/README.md) | Windows single-machine install, in French. |

[`../reports-implementation-checklist.md`](../reports-implementation-checklist.md)
is a finished to-do list from an earlier phase. Keep it for history; do not
treat it as current.
