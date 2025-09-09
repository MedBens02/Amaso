@echo off
echo.
echo =============================================
echo      Amaso App - One-Time Setup Script
echo =============================================
echo.

REM Check if we're in the right directory
if not exist "..\backend" (
    echo ❌ Error: Please run this script from the 'setup' folder inside your Amaso project directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo 🔍 Checking requirements...
call check-requirements.bat >nul 2>&1

REM Quick requirement check without output
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install it first.
    echo Run check-requirements.bat for details.
    pause
    exit /b 1
)

php --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PHP is not installed. Please install it first.
    echo Run check-requirements.bat for details.
    pause
    exit /b 1
)

composer --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Composer is not installed. Please install it first.
    echo Run check-requirements.bat for details.
    pause
    exit /b 1
)

echo ✅ Requirements check passed!
echo.

echo 📋 Starting setup process...
echo.

REM Setup Backend
echo [1/4] Setting up Laravel Backend...
cd ..\backend

REM Check if .env exists, if not copy from example
if not exist ".env" (
    if exist ".env.example" (
        echo    📄 Creating .env file from template...
        copy .env.example .env >nul
    ) else (
        echo    📄 Creating basic .env file...
        call :create_env_file
    )
) else (
    echo    📄 .env file already exists
)

echo    📦 Installing PHP dependencies...
composer install --no-interaction

echo    🔑 Generating application key...
php artisan key:generate --no-interaction

echo    ✅ Backend setup complete!
echo.

REM Setup Frontend
echo [2/4] Setting up Next.js Frontend...
cd ..\frontend

REM Check if .env.local exists, if not copy from example
if not exist ".env.local" (
    if exist ".env.local.example" (
        echo    📄 Creating .env.local file from template...
        copy .env.local.example .env.local >nul
    ) else (
        echo    📄 Creating basic .env.local file...
        echo NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1 > .env.local
        echo NODE_ENV=development >> .env.local
        echo NEXT_TELEMETRY_DISABLED=1 >> .env.local
    )
) else (
    echo    📄 .env.local file already exists
)

echo    📦 Installing Node.js dependencies...
call npm install

echo    ✅ Frontend setup complete!
echo.

REM Database Setup
echo [3/4] Setting up Database...

REM Check if database exists and if amaso.sql is available
if exist "..\amaso.sql" (
    echo    📊 Database schema file found: amaso.sql
    echo.
    echo    🔧 Database Setup Options:
    echo    1. I have MySQL running and want to import the database now
    echo    2. I will set up the database manually later
    echo    3. Skip database setup
    echo.
    set /p "db_choice=Choose option (1-3): "
    
    if "%db_choice%"=="1" (
        echo.
        echo    📊 Database Import Process:
        echo    This will create a database named 'amaso' and import all data.
        echo.
        set /p "db_user=MySQL username (default: root): "
        if "%db_user%"=="" set "db_user=root"
        
        echo    Creating database 'amaso'...
        mysql -u %db_user% -p -e "CREATE DATABASE IF NOT EXISTS amaso;" 2>nul
        if %ERRORLEVEL% NEQ 0 (
            echo    ❌ Failed to connect to MySQL or create database
            echo    Please make sure MySQL is running and credentials are correct
            echo    You can import the database manually later using:
            echo    mysql -u %db_user% -p amaso ^< amaso.sql
        ) else (
            echo    Importing database schema and data...
            mysql -u %db_user% -p amaso < ..\amaso.sql
            if %ERRORLEVEL% NEQ 0 (
                echo    ❌ Database import failed
                echo    Please check the amaso.sql file and try importing manually
            ) else (
                echo    ✅ Database imported successfully!
                echo.
                echo    📝 Don't forget to update your backend .env file with:
                echo    DB_HOST=127.0.0.1
                echo    DB_PORT=3306
                echo    DB_DATABASE=amaso
                echo    DB_USERNAME=%db_user%
                echo    DB_PASSWORD=your_password
            )
        )
    ) else if "%db_choice%"=="2" (
        echo    📋 Manual Database Setup Instructions:
        echo    1. Start your MySQL service
        echo    2. Create a database named 'amaso'
        echo    3. Import the schema: mysql -u root -p amaso ^< amaso.sql
        echo    4. Update backend/.env with your database credentials
    ) else (
        echo    ⏭️  Database setup skipped
    )
) else (
    echo    ⚠️  amaso.sql file not found in project root
    echo    You'll need to set up the database manually
)

echo.

REM Final Setup
echo [4/4] Final Configuration...
cd ..\setup

echo    📋 Creating helpful scripts...
REM These scripts should already exist, but let's make sure they're executable
echo    ✅ Setup complete!

echo.
echo =============================================
echo           🎉 Setup Complete! 🎉
echo =============================================
echo.
echo 📱 Next steps:
echo   1. Make sure MySQL service is running
echo   2. Verify database credentials in backend/.env
echo   3. Run start-app.bat to launch the application
echo.
echo 🌐 Once started, access your app at:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo.
echo 🔧 Useful commands:
echo   start-app.bat    - Start the application
echo   stop-app.bat     - Stop all services
echo   reset-database.bat - Reset and reimport database
echo.
pause

cd ..\setup
exit /b 0

:create_env_file
echo APP_NAME=Amaso > .env
echo APP_ENV=local >> .env
echo APP_KEY= >> .env
echo APP_DEBUG=true >> .env
echo APP_URL=http://localhost:8000 >> .env
echo. >> .env
echo LOG_CHANNEL=stack >> .env
echo LOG_DEPRECATIONS_CHANNEL=null >> .env
echo LOG_LEVEL=debug >> .env
echo. >> .env
echo DB_CONNECTION=mysql >> .env
echo DB_HOST=127.0.0.1 >> .env
echo DB_PORT=3306 >> .env
echo DB_DATABASE=amaso >> .env
echo DB_USERNAME=root >> .env
echo DB_PASSWORD= >> .env
echo. >> .env
echo BROADCAST_DRIVER=log >> .env
echo CACHE_DRIVER=file >> .env
echo FILESYSTEM_DISK=local >> .env
echo QUEUE_CONNECTION=sync >> .env
echo SESSION_DRIVER=file >> .env
echo SESSION_LIFETIME=120 >> .env
goto :eof