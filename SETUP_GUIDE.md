# AMASO — Setup

Three ways to run this, depending on what you need.

| I want to… | Go to | Time |
|---|---|---|
| **Develop** — edit the code, hot reload | [Development](#development) below | ~20 min |
| **Test it on the association's PC** | [`setup/README.md`](setup/README.md) *(français)* | ~10 min |
| **Put it on a server** they can reach from anywhere | [`deploy/README.md`](deploy/README.md) | ~20 min |

The stack is Next.js 15 (frontend), Laravel 12 (API) and MySQL/MariaDB.
Arabic throughout, RTL layout.

---

## Development

### Prerequisites

| | Version | |
|---|---|---|
| PHP | 8.2+ | XAMPP is the easiest route on Windows |
| Composer | 2.x | <https://getcomposer.org> |
| Node.js | 20+ | <https://nodejs.org> |
| MySQL / MariaDB | 8.0 / 10.6+ | Comes with XAMPP |
| Git | any | |

**On Windows**, install XAMPP to `C:\xampp`, then add `C:\xampp\php` to your
`PATH` (search "environment variables" → Path → New).

### PHP extensions

In `php.ini`, remove the leading `;` from each of these:

```ini
extension=curl
extension=fileinfo
extension=gd
extension=mbstring
extension=pdo_mysql
extension=zip
```

`gd` is the one that catches people out: nothing needs it until you generate
a PDF or an Excel report — those embed the association's logo, and mPDF and
PhpSpreadsheet will not install without it. If `composer install` fails
citing `ext-gd`, this is why.

Check with `php -m | grep -E "gd|mbstring|pdo_mysql"`.

### Setting up

```bash
git clone https://github.com/MedBens02/Amaso.git
cd Amaso
```

**Backend**

```bash
cd backend
composer install
cp .env.example .env          # copy .env.example .env   on Windows
php artisan key:generate
```

Edit `backend/.env` so the database section matches your MySQL:

```
DB_DATABASE=amaso
DB_USERNAME=root
DB_PASSWORD=
```

Create the database, then fill it:

```bash
php artisan migrate
php artisan db:seed                              # reference data + accounts
php artisan db:seed --class=DemoDataSeeder       # optional: demo records
```

**Frontend**

```bash
cd ../frontend
npm install
cp ../setup/.env.local.example .env.local
```

### Running

Two terminals:

```bash
cd backend  && php artisan serve      # http://localhost:8000
cd frontend && npm run dev            # http://localhost:3000
```

On Windows, `setup\start-app.bat` does both and opens the browser.

Sign in at <http://localhost:3000> as `admin@amaso.org` / `password`.

---

## The database

Three ways to get one, for three different situations.

| | When | How |
|---|---|---|
| **Migrate + seed** | Developing. Always matches the current migrations. | `php artisan migrate:fresh && php artisan db:seed` |
| **Import `amaso.sql`** | No PHP to hand — a colleague on a fresh machine, or phpMyAdmin only. | Create an empty database, then import the file |
| **Migrate only** | Real data already in place. | `php artisan migrate` |

`amaso.sql` is generated from `migrate:fresh` plus both seeders, so the two
first rows produce the same database. It holds 26 families, 53 orphans, 18
donors, 8 sponsors, three fiscal years of accounts and three academic years
of school records — **all of it invented**. Importing it drops and recreates
every table, so never run it against a database holding real records.

### Demo accounts

Password `password` for all three. Present only with the demo data.

| | |
|---|---|
| `admin@amaso.org` | Administrator — everything, including account management |
| `accountant@amaso.org` | Accountant — income, expenses, reports |
| `social@amaso.org` | Social worker — families, orphans, schooling |

**Change these before the application is used for anything real** (Settings
→ Account management).

---

## Layout

```
Amaso/
├── backend/        Laravel 12 API
│   ├── app/
│   │   ├── Http/Controllers/Api/V1/    endpoints
│   │   ├── Services/                   business rules, money handling
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/                 the schema, in order
│   │   └── seeders/                    reference data + DemoDataSeeder
│   └── resources/views/pdf/            PDF templates (mPDF)
├── frontend/       Next.js 15, App Router
│   ├── app/dashboard/                  one folder per screen
│   ├── components/                     shadcn/ui + the app's own
│   └── lib/api.ts                      the API client
├── setup/          Windows scripts and guide  (français)
├── deploy/         VM provisioning, deployment, backups
└── amaso.sql       demo database
```

Also worth reading: [`FINANCIAL-INTEGRITY.md`](FINANCIAL-INTEGRITY.md) for
how money movements are kept consistent, and [`REPORTS.md`](REPORTS.md) for
the reporting and export system.

---

## Common problems

| Symptom | Cause | Fix |
|---|---|---|
| `composer install` fails on `ext-gd` | Extension not enabled | See [PHP extensions](#php-extensions) |
| `composer install` fails on the PHP version | Your PHP is older than the lock file expects | `composer.json` pins `config.platform.php`; check `php -v` matches |
| Excel export returns 500 | `gd` missing | Same as above |
| PDF export returns 500, "Please provide a valid cache path" | `storage/framework/views` missing | `php artisan view:clear` recreates it |
| Every API call returns 401 | Token expired | Sign out and back in |
| Frontend shows "Failed to fetch" | Backend not running, or wrong URL | Check port 8000, and `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` |
| Changes to `.env` have no effect | Config is cached | `php artisan config:clear` |
| Arabic shows as `???` in the database | Wrong charset | The database must be `utf8mb4` / `utf8mb4_unicode_ci` |

### Starting the database over

Deletes everything in it:

```bash
cd backend
php artisan migrate:fresh --force
php artisan db:seed --force
php artisan db:seed --class=DemoDataSeeder --force
```
