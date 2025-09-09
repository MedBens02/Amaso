@echo off
echo.
echo =============================================
echo       Amaso App - Starting Services
echo =============================================
echo.

REM Check if we're in the right directory
if not exist "..\backend" (
    echo ❌ Error: Please run this script from the 'setup' folder inside your Amaso project directory
    pause
    exit /b 1
)

REM Check if setup was run
if not exist "..\backend\.env" (
    echo ❌ Backend .env file not found!
    echo Please run setup.bat first to configure the application.
    pause
    exit /b 1
)

if not exist "..\frontend\.env.local" (
    echo ❌ Frontend .env.local file not found!
    echo Please run setup.bat first to configure the application.
    pause
    exit /b 1
)

echo 🔍 Checking if services are already running...

REM Check if ports are in use
netstat -an | findstr ":8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Port 8000 is already in use (Laravel backend may be running)
)

netstat -an | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Port 3000 is already in use (Next.js frontend may be running)
)

echo.
echo 🚀 Starting services...
echo.

REM Check MySQL connection
echo [1/3] Checking MySQL connection...
mysql --user=root --execute="SELECT 1;" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Cannot connect to MySQL
    echo.
    echo 🔧 MySQL Setup Options:
    echo 1. I'm using XAMPP - Start XAMPP Control Panel and start MySQL
    echo 2. I have MySQL service - I'll start it manually
    echo 3. Continue without MySQL check (not recommended)
    echo.
    set /p "mysql_choice=Choose option (1-3): "
    
    if "%mysql_choice%"=="1" (
        echo.
        echo 📋 XAMPP Instructions:
        echo 1. Open XAMPP Control Panel
        echo 2. Click 'Start' next to MySQL
        echo 3. Wait for it to turn green
        echo 4. Press any key to continue...
        pause >nul
    ) else if "%mysql_choice%"=="2" (
        echo.
        echo Starting MySQL service...
        net start mysql >nul 2>&1
        if %ERRORLEVEL% NEQ 0 (
            echo ❌ Failed to start MySQL service automatically
            echo Please start MySQL manually and press any key to continue...
            pause >nul
        ) else (
            echo ✅ MySQL service started
        )
    ) else (
        echo ⚠️  Continuing without MySQL verification...
    )
) else (
    echo ✅ MySQL is running
)

echo.

REM Start Laravel Backend
echo [2/3] Starting Laravel Backend (http://localhost:8000)...
cd ..\backend

REM Open new command window for Laravel
start "Amaso Backend" cmd /c "echo Starting Laravel Backend... && echo. && composer dev"

REM Wait a moment for backend to start
echo ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo ✅ Backend started in separate window

REM Start Next.js Frontend
echo [3/3] Starting Next.js Frontend (http://localhost:3000)...
cd ..\frontend

REM Open new command window for Frontend
start "Amaso Frontend" cmd /c "echo Starting Next.js Frontend... && echo. && npm run dev"

echo ✅ Frontend started in separate window

cd ..\setup

echo.
echo =============================================
echo          🎉 Services Started! 🎉
echo =============================================
echo.
echo 🌐 Application URLs:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API:      http://localhost:8000/api/v1
echo.
echo 📊 Service Status:
echo   ✅ MySQL Database
echo   ✅ Laravel Backend (separate window)
echo   ✅ Next.js Frontend (separate window)
echo.
echo 💡 Tips:
echo   - Both backend and frontend are running in separate command windows
echo   - Close those windows to stop the services
echo   - Or use stop-app.bat to stop all services
echo   - Check the separate windows for logs and error messages
echo.
echo 🔧 Useful URLs for testing:
echo   - Backend health: http://localhost:8000/api/health
echo   - API documentation: http://localhost:8000/api/v1
echo.

REM Wait a moment then try to open the app
echo ⏳ Waiting for services to fully start...
timeout /t 5 /nobreak >nul

set /p "open_browser=🌐 Open application in browser? (y/N): "
if /i "%open_browser%"=="y" (
    echo Opening application...
    start http://localhost:3000
)

echo.
echo Press any key to exit this setup window...
echo (The application will continue running in the background)
pause >nul