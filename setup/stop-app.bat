@echo off
title Amaso App - Stopping Services
color 0c
echo.
echo =============================================
echo       🛑 Amaso App - Quick Stop 🛑
echo =============================================
echo.

echo 🧹 Stopping all Amaso services...
echo.

REM Stop Laravel Backend
echo [1/2] 🔄 Stopping Laravel Backend...
for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr ":8000"') do (
    if not "%%i"=="0" taskkill /PID %%i /F >nul 2>&1
)
taskkill /IM php.exe /F >nul 2>&1
echo     ✅ Backend stopped

REM Stop Next.js Frontend  
echo [2/2] 🔄 Stopping Next.js Frontend...
for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr ":3000"') do (
    if not "%%i"=="0" taskkill /PID %%i /F >nul 2>&1
)
wmic process where "name='node.exe' and commandline like '%next%'" delete >nul 2>&1
echo     ✅ Frontend stopped

REM Close service windows
echo.
echo 🗙 Closing service windows...
taskkill /FI "WINDOWTITLE eq Amaso Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Amaso Frontend*" /F >nul 2>&1
echo     ✅ Windows closed

echo.
echo =============================================
echo         🛑 Services Stopped! 🛑
echo =============================================
echo.
echo 📊 Final Status:
echo   ✅ Laravel Backend (port 8000) - Stopped
echo   ✅ Next.js Frontend (port 3000) - Stopped  
echo   ✅ Service windows - Closed
echo   ⏸️  MySQL Database (XAMPP) - Still running
echo.
echo 💡 MySQL is left running in XAMPP for quick restart
echo 🚀 Use start-app.bat to restart services
echo.
echo Closing in 5 seconds...
timeout /t 5 >nul
exit