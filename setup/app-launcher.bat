@echo off
setlocal EnableDelayedExpansion
title Amaso App - Launcher
color 0f
echo.
echo =============================================
echo        ✨ Amaso App - Launcher ✨
echo =============================================
echo.
echo 🎯 Choose your action:
echo.
echo   1. ▶️  Start App (Launch all services)
echo   2. 🛑 Stop App (Close all services)  
echo   3. 🌐 Open App (Quick browser access)
echo   4. 📊 Status (Check what's running)
echo   5. 🔄 Update App (Get latest version)
echo   6. ❌ Exit
echo.

:menu
set /p "choice=Enter your choice (1-6): "
echo.

if "%choice%"=="1" goto :start_app
if "%choice%"=="2" goto :stop_app
if "%choice%"=="3" goto :open_app
if "%choice%"=="4" goto :status
if "%choice%"=="5" goto :update_app
if "%choice%"=="6" goto :exit

echo ❌ Invalid choice. Please select 1-6.
echo.
goto :menu

:start_app
echo 🚀 Starting Amaso application...
call start-app.bat
goto :menu

:stop_app  
echo 🛑 Stopping Amaso application...
call stop-app.bat
goto :menu

:open_app
echo 🌐 Opening Amaso application...
call open-urls.bat
goto :menu

:status
echo 📊 Checking service status...
echo.

REM Check Frontend
netstat -an | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend (port 3000): Running
    echo    └─ http://localhost:3000
) else (
    echo ❌ Frontend (port 3000): Stopped
)

REM Check Backend
netstat -an | findstr ":8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend (port 8000): Running  
    echo    └─ http://localhost:8000
) else (
    echo ❌ Backend (port 8000): Stopped
)

REM Check MySQL (basic check)
mysql --user=root --execute="SELECT 1;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL Database: Connected
) else (
    echo ⚠️  MySQL Database: Not accessible (check XAMPP)
)

echo.
echo 💡 Quick Actions:
echo   - If services are stopped: Choose option 1 to start
echo   - If services are running: Choose option 3 to open browser
echo   - To close everything: Choose option 2 to stop
echo.
set /p "return=Press Enter to return to main menu..."
echo.
goto :menu

:update_app
echo 🔄 Updating Amaso application...
call update-app.bat
goto :menu

:exit
echo.
echo =============================================
echo          👋 Thanks for using Amaso!
echo =============================================
echo.
echo 📋 Quick Reference (copy these URLs):
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API:      http://localhost:8000/api/v1  
echo.
echo 💡 Pro Tips:
echo   - Create desktop shortcuts to these .bat files
echo   - Pin start-app.bat to taskbar for one-click start
echo   - Use open-urls.bat for quick browser access
echo.
echo Goodbye! 👋
timeout /t 3 >nul
exit