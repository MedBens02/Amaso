# 🚀 Amaso Application Setup Guide

## Running Amaso locally (Next.js + Laravel + MySQL)

This guide covers setting up the application directly on your machine — no containers
involved. On Windows, the `setup/` folder also provides one-click launchers
(`app-launcher.bat`, `start-app.bat`, …) and French installation guides that automate
the steps below.

## 📋 Prerequisites

- **PHP 8.2+** with the usual Laravel extensions (mbstring, openssl, pdo_mysql, …)
- **Composer** 2.x
- **Node.js 18+** with npm
- **MySQL 8.0+** — a XAMPP installation works fine (the Windows launcher scripts assume it)
- **Git**

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/MedBens02/Amaso.git
cd Amaso
```

### 2. Backend (Laravel)

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Edit `.env` and point it at your MySQL server:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=amaso
DB_USERNAME=root
DB_PASSWORD=
```

Create the database, then build the schema:

```bash
# in MySQL: CREATE DATABASE amaso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
php artisan migrate --seed
```

### 3. Frontend (Next.js)

```bash
cd ../frontend
npm install
cp ../setup/.env.local.example .env.local
```

`.env.local` should contain:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## 🏃 Running the application

Two terminals:

```bash
# Terminal 1 - backend (serves the API on port 8000)
cd backend
composer dev        # or: php artisan serve

# Terminal 2 - frontend (port 3000)
cd frontend
npm run dev
```

Then open **http://localhost:3000**.

On Windows you can instead double-click `setup/start-app.bat` (and
`setup/stop-app.bat` to stop everything) — see `setup/README-SETUP.md`.

### URLs

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/api/v1
- **API health check**: http://localhost:8000/api/health

## 🗄️ Database: migrations vs. amaso.sql

The full schema lives in Laravel migrations (`backend/database/migrations/`), so
`amaso.sql` is no longer required to set up a database:

```bash
# Fresh install (empty database)
cd backend
php artisan migrate --seed     # creates all 45 tables + the v_current_cash view,
                               # then seeds users, reference data, accounting
                               # categories (incl. the required fallback category
                               # id 999) and the current fiscal year
```

```bash
# Existing database that was imported from amaso.sql
cd backend
php artisan migrate            # safe: each migration skips tables that already
                               # exist, and only records itself as run
php artisan db:seed            # optional; seeders are idempotent (updateOrInsert)
```

Keep `amaso.sql` only as a sample-data snapshot — new environments should prefer
`migrate --seed`.

### Backup / restore

```bash
# Backup
mysqldump -u root -p amaso > backup_$(date +%Y%m%d).sql

# Restore
mysql -u root -p amaso < backup_file.sql
```

## ✅ Verification

```bash
curl http://localhost:8000/api/health          # {"status":"ok",...}
curl http://localhost:8000/api/v1/widows       # JSON list (empty data on a fresh DB)
```

In the browser: log in, create a widow record, and open the references management
pages to confirm reads and writes work.

## 🛠️ Troubleshooting

**Port already in use (3000 / 8000)**
Find and stop the conflicting process, or run the servers on other ports
(`php artisan serve --port=8001`, `npm run dev -- -p 3001`) and update
`NEXT_PUBLIC_API_BASE_URL` accordingly.

**`SQLSTATE[HY000] [2002] Connection refused`**
MySQL isn't running (start it in XAMPP) or `.env` points at the wrong host/port.

**`Class ... not found` after pulling new code**
```bash
cd backend
composer install
php artisan optimize:clear
```

**Frontend can't reach the API (network errors in the console)**
Make sure the backend is running on port 8000 and `NEXT_PUBLIC_API_BASE_URL` in
`frontend/.env.local` matches it, then restart `npm run dev` (Next.js only reads
env files at startup).
