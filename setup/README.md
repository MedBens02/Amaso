# 🖥️ Amaso Windows Setup Scripts

This folder contains Windows batch scripts to easily set up and run the Amaso application natively on Windows.

## 📁 Setup Files Overview

### 🚀 Main Setup Scripts
- **`setup.bat`** - One-time setup script that configures the entire application
- **`check-requirements.bat`** - Verifies all required software is installed
- **`install-dependencies.bat`** - Installs PHP and Node.js dependencies only

### 🎮 Application Management
- **`start-app.bat`** - Launch all services (MySQL, Laravel backend, Next.js frontend)
- **`stop-app.bat`** - Stop all running services gracefully
- **`open-urls.bat`** - Quick access to application URLs in browser

### 🔧 Utilities & Helpers
- **`start-mysql.bat`** - MySQL startup helper (handles XAMPP and standalone MySQL)
- **`reset-database.bat`** - Reset and reimport the database completely
- **`view-logs.bat`** - View application logs and check service status

### 📄 Configuration Templates
- **`.env.template`** - Laravel backend environment configuration template
- **`.env.local.template`** - Next.js frontend environment configuration template

### 📖 Documentation
- **`WINDOWS_INSTALLATION_GUIDE.md`** - Comprehensive installation guide
- **`README.md`** - This file

## 🚀 Quick Start

### For First-Time Setup:
1. Install prerequisites (Node.js, PHP, Composer, MySQL) - see installation guide
2. Run: `check-requirements.bat`
3. Run: `setup.bat`
4. Run: `start-app.bat`

### For Daily Use:
- **Start app**: `start-app.bat`
- **Stop app**: `stop-app.bat`
- **Open in browser**: `open-urls.bat`

## 📋 Script Details

### setup.bat
**What it does:**
- Verifies all requirements are met
- Installs PHP dependencies (Composer)
- Installs Node.js dependencies (NPM)
- Creates environment configuration files
- Generates Laravel application key
- Optionally imports database schema

**When to use:** First time setup, or after major updates

### start-app.bat
**What it does:**
- Checks MySQL connection
- Starts Laravel backend server (port 8000)
- Starts Next.js frontend server (port 3000)
- Opens separate command windows for each service
- Optionally opens application in browser

**When to use:** Every time you want to run the application

### stop-app.bat
**What it does:**
- Stops processes using ports 8000 and 3000
- Closes Laravel and Next.js service windows
- Optionally stops MySQL service

**When to use:** When you want to stop the application

### check-requirements.bat
**What it does:**
- Verifies Node.js installation and version
- Verifies PHP installation and version
- Verifies Composer installation
- Verifies MySQL availability

**When to use:** Before setup, or when troubleshooting installation issues

## 🌐 Application Access

After running `start-app.bat`, access the application at:

- **Frontend (Main App)**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Health Check**: http://localhost:8000/api/health
- **API Documentation**: http://localhost:8000/api/v1

## 🆘 Troubleshooting

### Common Issues

**1. "Requirements not met" errors**
- Run `check-requirements.bat` to see what's missing
- Follow the installation guide to install missing software

**2. "Port already in use" errors**
- Run `stop-app.bat` to stop existing services
- Check if other applications are using ports 3000 or 8000
- Restart your computer if ports are stuck

**3. MySQL connection errors**
- Run `start-mysql.bat` to start MySQL
- For XAMPP: Open XAMPP Control Panel and start MySQL
- Check database credentials in `backend\.env`

**4. Database import fails**
- Make sure MySQL is running
- Verify `amaso.sql` exists in project root
- Run `reset-database.bat` to try again

**5. Dependency installation fails**
- Check internet connection
- For PHP: Clear Composer cache with `composer clear-cache`
- For Node.js: Clear NPM cache with `npm cache clean --force`

### Getting Help

1. **Check logs**: Run `view-logs.bat` to see error messages
2. **Verify status**: Check if services are running with `open-urls.bat`
3. **Reset everything**: Stop services, run `setup.bat` again
4. **Fresh start**: Delete `node_modules` and `vendor` folders, run `install-dependencies.bat`

## 📂 File Locations

```
Amaso/
├── setup/                    # This folder
│   ├── *.bat                # Batch scripts
│   ├── *.template           # Configuration templates
│   └── *.md                 # Documentation
├── backend/                 # Laravel backend
│   ├── .env                 # Backend configuration (created by setup)
│   └── storage/logs/        # Laravel logs
├── frontend/                # Next.js frontend
│   ├── .env.local          # Frontend configuration (created by setup)
│   └── .next/              # Next.js build files
└── amaso.sql               # Database schema and data
```

## 🔧 Advanced Usage

### Custom Ports
If you need to use different ports:
1. Edit `backend\.env` - change `APP_URL=http://localhost:8001`
2. Edit `frontend\.env.local` - change `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api/v1`
3. Modify the batch scripts to use your custom ports

### Development vs Production
- The scripts set up a development environment by default
- For production, additional configuration is needed (SSL, reverse proxy, etc.)
- See the main README.md for production deployment options

### Database Management
- **Import fresh data**: `reset-database.bat`
- **Backup data**: Use MySQL tools or phpMyAdmin
- **Change credentials**: Edit `backend\.env` and restart services

## 📝 Notes

- Scripts are designed for Windows 10/11
- PowerShell commands are used for some advanced features
- All scripts include error handling and user-friendly messages
- Services run in separate windows so you can see logs
- MySQL must be running before starting the application
- The application uses Arabic/RTL interface with full localization