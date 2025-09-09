@echo off
cls
echo.
echo =============================================
echo    Amaso App - Requirements Checker
echo =============================================
echo.

echo Checking required software...
echo.

echo [1/5] Node.js:
node --version 2>nul && echo    ✅ Installed || echo    ❌ Missing

echo [2/5] NPM:
npm --version 2>nul && echo    ✅ Installed || echo    ❌ Missing

echo [3/5] PHP:
php --version 2>nul 1>nul && echo    ✅ Installed || echo    ❌ Missing

echo [4/5] Composer:
composer --version 2>nul 1>nul && echo    ✅ Installed || echo    ❌ Missing

echo [5/5] MySQL:
mysql --version 2>nul 1>nul && echo    ✅ Installed || echo    ❌ Missing

echo.
echo =============================================
echo.
echo If any items show as Missing, please install them:
echo - Node.js: https://nodejs.org/
echo - PHP: Install XAMPP from https://www.apachefriends.org/
echo - Composer: https://getcomposer.org/download/
echo.
echo For detailed instructions, see: WINDOWS_INSTALLATION_GUIDE.md
echo.
pause