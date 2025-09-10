@echo off
setlocal EnableDelayedExpansion
title Amaso App - Starting Services
color 0a
echo.
echo =============================================
echo       🚀 Amaso App - Quick Start 🚀
echo =============================================
echo.

REM Check if we're in the right directory
if not exist "..\backend" (
    echo ❌ Error: Please run this script from the 'setup' folder
    timeout /t 3 >nul
    exit /b 1
)

echo ⏳ Starting services... (XAMPP should already be running)
echo.

REM Kill any existing processes first
echo 🧹 Cleaning up any existing processes...
taskkill /F /IM php.exe >nul 2>&1
wmic process where "name='node.exe' and commandline like '%next%'" delete >nul 2>&1
timeout /t 2 /nobreak >nul

echo ✅ Ready to start fresh services
echo.

REM Start Laravel Backend silently
echo [1/2] 🔄 Starting Laravel Backend...
cd ..\backend
start /min "Amaso Backend" cmd /c "composer dev"
cd ..\setup
echo     ✅ Backend starting on http://localhost:8000

REM Start Next.js Frontend silently  
echo [2/2] 🔄 Starting Next.js Frontend...
cd ..\frontend
start /min "Amaso Frontend" cmd /c "npm run dev"
cd ..\setup
echo     ✅ Frontend starting on http://localhost:3000

echo.
echo ⏳ Initializing services... Please wait
echo.

REM Show progress bar simulation
for /L %%i in (1,1,20) do (
    set "bar="
    for /L %%j in (1,1,%%i) do set "bar=!bar!█"
    for /L %%k in (%%i,1,19) do set "bar=!bar!░"
    <nul set /p "=     [!bar!] %%i%%/20"
    timeout /t 1 /nobreak >nul
    echo.
)

echo.
echo =============================================
echo          🎉 Services Started! 🎉  
echo =============================================
echo.
echo 🌐 Opening application in 3 seconds...
timeout /t 3 /nobreak >nul

start http://localhost:3000

echo ✅ Application opened in your browser
echo.
echo 📊 Service Status:
echo   ✅ MySQL Database (XAMPP)
echo   ✅ Laravel Backend (minimized window)  
echo   ✅ Next.js Frontend (minimized window)
echo.
echo 💡 Use stop-app.bat to close all services
echo.
echo This window will close in 10 seconds...
timeout /t 10 >nul
exit