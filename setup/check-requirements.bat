@echo off
echo.
echo =============================================
echo    Amaso App - Requirements Checker
echo =============================================
echo.

set "all_good=true"

echo Checking required software...
echo.

REM Check Node.js
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is NOT installed
    echo    Please install Node.js from https://nodejs.org/
    set "all_good=false"
) else (
    for /f %%i in ('node --version') do set "node_version=%%i"
    echo ✅ Node.js is installed: %node_version%
)

REM Check NPM
echo [2/5] Checking NPM...
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ NPM is NOT installed
    set "all_good=false"
) else (
    for /f %%i in ('npm --version') do set "npm_version=%%i"
    echo ✅ NPM is installed: v%npm_version%
)

REM Check PHP
echo [3/5] Checking PHP...
php --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PHP is NOT installed
    echo    Please install PHP 8.2+ or XAMPP from https://www.apachefriends.org/
    set "all_good=false"
) else (
    for /f "tokens=1,2" %%i in ('php --version ^| findstr "PHP"') do set "php_version=%%j"
    echo ✅ PHP is installed: %php_version%
)

REM Check Composer
echo [4/5] Checking Composer...
composer --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Composer is NOT installed
    echo    Please install Composer from https://getcomposer.org/download/
    set "all_good=false"
) else (
    for /f "tokens=1,2,3" %%i in ('composer --version ^| findstr "Composer"') do set "composer_version=%%k"
    echo ✅ Composer is installed: %composer_version%
)

REM Check MySQL
echo [5/5] Checking MySQL...
mysql --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ MySQL command line is NOT available
    echo    Please install MySQL or XAMPP, or make sure MySQL is in your PATH
    set "all_good=false"
) else (
    echo ✅ MySQL command line is available
)

echo.
echo =============================================

if "%all_good%"=="true" (
    echo 🎉 All requirements are installed!
    echo You can now run setup.bat to configure the application.
) else (
    echo ⚠️  Some requirements are missing.
    echo Please install the missing software and run this check again.
    echo.
    echo For detailed installation instructions, see:
    echo WINDOWS_INSTALLATION_GUIDE.md
)

echo.
pause