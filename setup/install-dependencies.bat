@echo off
echo.
echo =============================================
echo    Amaso App - Dependencies Installation
echo =============================================
echo.

REM Check if we're in the right directory
if not exist "..\backend" (
    echo ❌ Error: Please run this script from the 'setup' folder inside your Amaso project directory
    pause
    exit /b 1
)

echo 🔍 Checking prerequisites...
echo.

REM Quick requirement check
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

php --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ PHP is not installed or not in PATH
    echo Please install PHP or XAMPP
    pause
    exit /b 1
)

composer --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Composer is not installed or not in PATH
    echo Please install Composer from https://getcomposer.org/
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

echo 📦 Installing dependencies...
echo.
echo This may take several minutes depending on your internet connection.
echo.

REM Install Backend Dependencies
echo [1/2] Installing Laravel Backend Dependencies...
echo =============================================
cd ..\backend

echo Current directory: %CD%
echo.

if not exist "composer.json" (
    echo ❌ Error: composer.json not found in backend directory
    cd ..\setup
    pause
    exit /b 1
)

echo 📥 Running: composer install
echo This will install all PHP packages required by Laravel...
echo.

composer install --no-interaction --prefer-dist
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Backend dependency installation failed!
    echo.
    echo 🔧 Common solutions:
    echo   1. Check your internet connection
    echo   2. Clear Composer cache: composer clear-cache
    echo   3. Try: composer install --no-cache
    echo   4. Check if all PHP extensions are enabled
    echo.
    pause
    cd ..\setup
    exit /b 1
)

echo ✅ Backend dependencies installed successfully
echo.

REM Install Frontend Dependencies
echo [2/2] Installing Next.js Frontend Dependencies...
echo =============================================
cd ..\frontend

echo Current directory: %CD%
echo.

if not exist "package.json" (
    echo ❌ Error: package.json not found in frontend directory
    cd ..\setup
    pause
    exit /b 1
)

echo 📥 Running: npm install
echo This will install all Node.js packages required by Next.js...
echo.

call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Frontend dependency installation failed!
    echo.
    echo 🔧 Common solutions:
    echo   1. Check your internet connection
    echo   2. Clear npm cache: npm cache clean --force
    echo   3. Delete node_modules and try again
    echo   4. Try: npm install --legacy-peer-deps
    echo.
    pause
    cd ..\setup
    exit /b 1
)

echo ✅ Frontend dependencies installed successfully
echo.

cd ..\setup

REM Display summary
echo.
echo =============================================
echo        🎉 Installation Complete! 🎉
echo =============================================
echo.
echo 📊 Summary:
echo   ✅ Backend (Laravel): PHP packages installed via Composer
echo   ✅ Frontend (Next.js): Node.js packages installed via NPM
echo.
echo 📁 Installed packages:
echo.

echo Backend packages:
if exist "..\backend\vendor" (
    echo   ✅ vendor/ directory created
    echo   📦 Main packages: Laravel Framework, dependencies
) else (
    echo   ❌ vendor/ directory missing
)

echo.
echo Frontend packages:
if exist "..\frontend\node_modules" (
    echo   ✅ node_modules/ directory created
    echo   📦 Main packages: Next.js, React, TypeScript, Tailwind CSS
) else (
    echo   ❌ node_modules/ directory missing
)

echo.
echo 🚀 Next steps:
echo   1. Run setup.bat to configure environment files
echo   2. Run start-app.bat to launch the application
echo   3. Or run the full setup process if you haven't already
echo.

REM Check disk space used
echo 💾 Disk space used:
if exist "..\backend\vendor" (
    for /f %%i in ('dir "..\backend\vendor" /s /-c ^| find "bytes"') do echo   Backend: %%i
)
if exist "..\frontend\node_modules" (
    for /f %%i in ('dir "..\frontend\node_modules" /s /-c ^| find "bytes"') do echo   Frontend: %%i
)

echo.
pause