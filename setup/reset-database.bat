@echo off
echo.
echo =============================================
echo     Amaso App - Database Reset & Import
echo =============================================
echo.

REM Check if amaso.sql exists
if not exist "..\amaso.sql" (
    echo ❌ Error: amaso.sql file not found in project root
    echo Please make sure the database schema file exists.
    pause
    exit /b 1
)

echo ⚠️  WARNING: This will completely reset your database!
echo All existing data will be lost and replaced with the initial data.
echo.
set /p "confirm=Are you sure you want to continue? (yes/NO): "

if not "%confirm%"=="yes" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo 🔄 Starting database reset process...
echo.

REM Get MySQL credentials
set /p "db_user=MySQL username (default: root): "
if "%db_user%"=="" set "db_user=root"

echo.
echo [1/3] Dropping existing database (if exists)...
mysql -u %db_user% -p -e "DROP DATABASE IF EXISTS amaso;" 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to connect to MySQL
    echo Please make sure MySQL is running and credentials are correct.
    pause
    exit /b 1
)
echo ✅ Existing database dropped

echo [2/3] Creating fresh database...
mysql -u %db_user% -p -e "CREATE DATABASE amaso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create database
    pause
    exit /b 1
)
echo ✅ Fresh database created

echo [3/3] Importing database schema and data...
mysql -u %db_user% -p amaso < ..\amaso.sql
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to import database
    echo Please check the amaso.sql file for errors.
    pause
    exit /b 1
)
echo ✅ Database imported successfully

echo.
echo 🔧 Updating backend configuration...

REM Check if backend .env exists and update database settings
if exist "..\backend\.env" (
    echo Updating .env file with database settings...
    
    REM Create a temporary file with updated database settings
    (
        for /f "usebackq delims=" %%i in ("..\backend\.env") do (
            set "line=%%i"
            setlocal EnableDelayedExpansion
            if "!line:~0,8!"=="DB_HOST=" (
                echo DB_HOST=127.0.0.1
            ) else if "!line:~0,8!"=="DB_PORT=" (
                echo DB_PORT=3306
            ) else if "!line:~0,12!"=="DB_DATABASE=" (
                echo DB_DATABASE=amaso
            ) else if "!line:~0,12!"=="DB_USERNAME=" (
                echo DB_USERNAME=%db_user%
            ) else (
                echo !line!
            )
            endlocal
        )
    ) > "..\backend\.env.temp"
    
    REM Replace the original .env file
    move "..\backend\.env.temp" "..\backend\.env" >nul
    echo ✅ Backend .env updated
) else (
    echo ⚠️  Backend .env file not found
    echo Please run setup.bat to create the configuration files
)

echo.
echo =============================================
echo        🎉 Database Reset Complete! 🎉
echo =============================================
echo.
echo 📊 Database Information:
echo   Database: amaso
echo   Username: %db_user%
echo   Host: 127.0.0.1:3306
echo.
echo 📋 What was done:
echo   ✅ Old database dropped
echo   ✅ Fresh database created
echo   ✅ Schema and data imported
echo   ✅ Backend configuration updated
echo.
echo 🚀 Next steps:
echo   1. Start the application: start-app.bat
echo   2. Access frontend: http://localhost:3000
echo   3. Test backend API: http://localhost:8000/api/v1
echo.
pause