# 🖥️ Windows Installation Guide for Amaso App

## Prerequisites Installation

This guide will help you set up the Amaso application natively on a fresh Windows machine.

### 1. 📋 System Requirements
- Windows 10 or Windows 11
- At least 4GB RAM
- 2GB free disk space
- Internet connection

### 2. 🟢 Node.js Installation
1. Go to https://nodejs.org/
2. Download the **LTS version** (Long Term Support)
3. Run the installer with default settings
4. **Verify installation:**
   - Open Command Prompt (`Win + R`, type `cmd`, press Enter)
   - Type: `node --version` (should show v18.x.x or higher)
   - Type: `npm --version` (should show a version number)

### 3. 🐘 PHP Installation
**Option A: XAMPP (Recommended for beginners)**
1. Go to https://www.apachefriends.org/
2. Download XAMPP for Windows
3. Install with default settings
4. Start XAMPP Control Panel
5. Start Apache and MySQL services

**Option B: Standalone PHP**
1. Go to https://windows.php.net/download/
2. Download PHP 8.2+ (Thread Safe version)
3. Extract to `C:\php`
4. Add `C:\php` to your system PATH
5. Copy `php.ini-development` to `php.ini`
6. Enable required extensions in `php.ini`:
   ```ini
   extension=mbstring
   extension=openssl
   extension=pdo_mysql
   extension=fileinfo
   extension=tokenizer
   extension=xml
   ```

### 4. 🎵 Composer Installation
1. Go to https://getcomposer.org/download/
2. Download and run `Composer-Setup.exe`
3. Follow the installer (it will detect PHP automatically)
4. **Verify installation:**
   - Open Command Prompt
   - Type: `composer --version`

### 5. 🗄️ MySQL Installation
**If using XAMPP:** MySQL is already included, skip this step.

**Standalone MySQL:**
1. Go to https://dev.mysql.com/downloads/mysql/
2. Download MySQL Community Server
3. Run the installer
4. Choose "Developer Default" setup
5. Set a root password (remember this!)
6. Complete installation

### 6. 📁 Git Installation
1. Go to https://git-scm.com/download/win
2. Download Git for Windows
3. Install with default settings
4. **Verify installation:**
   - Open Command Prompt
   - Type: `git --version`

## 🚀 Quick Setup

After installing all prerequisites:

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd Amaso
   ```

2. **Run the setup script:**
   ```bash
   cd setup
   setup.bat
   ```

3. **Start the application:**
   ```bash
   start-app.bat
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## 🔧 Manual Setup (Alternative)

If you prefer to set up manually:

### Database Setup
1. Start MySQL service
2. Open MySQL command line or phpMyAdmin
3. Create database: `CREATE DATABASE amaso;`
4. Import the database:
   ```bash
   mysql -u root -p amaso < amaso.sql
   ```

### Backend Setup
```bash
cd backend
composer install
copy .env.example .env
# Edit .env file with your database credentials
php artisan key:generate
```

### Frontend Setup
```bash
cd frontend
npm install
copy .env.local.example .env.local
# Edit .env.local with: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

## 🆘 Troubleshooting

### Common Issues

**1. "PHP not found" error**
- Make sure PHP is added to your system PATH
- Restart Command Prompt after installing PHP

**2. "Composer not found" error**
- Restart Command Prompt after installing Composer
- Try running from a new Command Prompt window

**3. MySQL connection errors**
- Make sure MySQL service is running
- Check your database credentials in `.env`
- For XAMPP users: Use username `root` with no password by default

**4. Port conflicts**
- If port 3000 is in use, Next.js will automatically try port 3001
- If port 8000 is in use, modify Laravel's server port: `php artisan serve --port=8001`

**5. NPM installation issues**
- Try clearing npm cache: `npm cache clean --force`
- Delete `node_modules` folder and run `npm install` again

### Getting Help
- Check the console output for specific error messages
- Make sure all services (MySQL, Laravel, Next.js) are running
- Verify that all prerequisites are properly installed

## 📝 Notes
- The setup scripts will automatically handle most configuration
- Make sure to keep MySQL running when using the application
- The application uses ports 3000 (frontend) and 8000 (backend) by default