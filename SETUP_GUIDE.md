# Amaso — Setup Guide (Windows, from scratch)

Goal: run the app on a fresh Windows PC that only has Windows + VS Code.
Takes about 30 minutes, mostly downloads.

The stack: **Next.js** (frontend, port 3000) + **Laravel** (API, port 8000) + **MySQL**.

---

## 1. Install the tools (one time)

Install in this order, accepting the default options unless noted.

### 1.1 Git
Download and install: https://git-scm.com/download/win

### 1.2 XAMPP (gives you PHP 8.2+ and MySQL)
Download and install: https://www.apachefriends.org (pick the PHP 8.2 version, install to `C:\xampp`)

### 1.3 Put PHP on your PATH
1. Press `Win`, type **"environment variables"**, open *Edit the system environment variables* → **Environment Variables**
2. Under *User variables*, select **Path** → **Edit** → **New** → enter `C:\xampp\php` → OK everywhere

### 1.4 Enable the PHP extensions Laravel needs
Open `C:\xampp\php\php.ini` in VS Code, find these lines and remove the leading `;` if present, then save:

```ini
extension=curl
extension=fileinfo
extension=mbstring
extension=pdo_mysql
extension=zip
```

### 1.5 Composer (PHP package manager)
Download and run **Composer-Setup.exe**: https://getcomposer.org/download/
(it should auto-detect `C:\xampp\php\php.exe`)

### 1.6 Node.js (includes npm)
Download and install the **LTS** version: https://nodejs.org

### 1.7 Verify everything
Close and reopen any terminal, then run:

```powershell
git --version
php -v          # should say 8.2 or newer
composer -V
node -v
npm -v
```

All five must print a version. If `php` is not recognized, redo step 1.3 and reopen the terminal.

---

## 2. Get the code

```powershell
cd C:\
git clone https://github.com/MedBens02/Amaso.git
```

Open the `C:\Amaso` folder in VS Code. Use its integrated terminal (`` Ctrl+` ``) for all commands below.

---

## 3. Create the database

1. Open the **XAMPP Control Panel** (Start menu) and click **Start** next to **MySQL** (and **Apache** if you want phpMyAdmin)
2. Create the database — either in phpMyAdmin (http://localhost/phpmyadmin → *New* → name `amaso`, collation `utf8mb4_unicode_ci` → *Create*), or from the terminal:

```powershell
C:\xampp\mysql\bin\mysql -u root -e "CREATE DATABASE amaso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

> MySQL must be running (green in XAMPP) every time you use the app.

---

## 4. Set up the backend (Laravel)

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
```

Open `backend/.env` in VS Code and change the database block to:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=amaso
DB_USERNAME=root
DB_PASSWORD=
```

(`root` with an empty password is the XAMPP default.)

Then build the schema and seed the base data:

```powershell
php artisan migrate --seed
```

This creates all 44 tables + the `v_current_cash` view, and seeds the admin user,
reference data, accounting categories (including the required fallback category
id 999) and the current fiscal year.

> Have an existing database exported from `amaso.sql` instead? Import it first,
> then run `php artisan migrate` — the migrations detect existing tables and skip them.

---

## 5. Set up the frontend (Next.js)

```powershell
cd ..\frontend
npm install
copy ..\setup\.env.local.example .env.local
```

The copied `.env.local` already points at the API (`http://localhost:8000/api/v1`) — no edits needed.

---

## 6. Run the app

Two terminals in VS Code (`+` button in the terminal panel to open a second one):

```powershell
# Terminal 1 — API
cd backend
php artisan serve
```

```powershell
# Terminal 2 — frontend
cd frontend
npm run dev
```

Open **http://localhost:3000** and log in with the demo account:

- Email: `admin@amaso.org`
- Password: `admin123`

To stop, press `Ctrl+C` in each terminal.

> Alternative: the `setup/` folder has Windows launchers (`start-app.bat`,
> `stop-app.bat`, `app-launcher.bat`) that start/stop both servers for you —
> XAMPP MySQL must be running first. See `setup/README-SETUP.md`.

---

## Daily routine (after the first setup)

1. XAMPP → Start **MySQL**
2. Terminal 1: `cd backend` → `php artisan serve`
3. Terminal 2: `cd frontend` → `npm run dev`
4. http://localhost:3000

After pulling new code: `composer install` (backend), `npm install` (frontend),
`php artisan migrate` — then start as usual.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `php` / `composer` / `node` not recognized | The tool isn't installed or not on PATH (step 1.3). Reopen the terminal after fixing. |
| `could not find driver` during migrate | `extension=pdo_mysql` still commented in `C:\xampp\php\php.ini` (step 1.4). |
| `SQLSTATE[HY000] [2002]` connection refused | MySQL isn't running — start it in the XAMPP Control Panel. |
| `Access denied for user 'root'` | Your MySQL root has a password — put it in `DB_PASSWORD` in `backend/.env`. |
| Port 3000 or 8000 already in use | `php artisan serve --port=8001` / `npm run dev -- -p 3001`, and update `NEXT_PUBLIC_API_BASE_URL` in `frontend/.env.local` to the new API port. |
| Frontend shows network errors | Backend not running, or you changed `.env.local` without restarting `npm run dev` (Next.js reads env files only at startup). |
| Backup / restore | `C:\xampp\mysql\bin\mysqldump -u root amaso > backup.sql` / `C:\xampp\mysql\bin\mysql -u root amaso < backup.sql` |
