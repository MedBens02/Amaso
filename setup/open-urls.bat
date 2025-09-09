@echo off
echo.
echo =============================================
echo      Amaso App - Quick URL Access
echo =============================================
echo.

echo 🌐 Opening Amaso application URLs...
echo.

REM Check if services are running first
echo 🔍 Checking service status...
echo.

netstat -an | findstr ":8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend (port 8000): Running
    set "backend_running=true"
) else (
    echo ❌ Backend (port 8000): Not running
    set "backend_running=false"
)

netstat -an | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Frontend (port 3000): Running
    set "frontend_running=true"
) else (
    echo ❌ Frontend (port 3000): Not running
    set "frontend_running=false"
)

echo.

if "%frontend_running%"=="false" (
    if "%backend_running%"=="false" (
        echo ⚠️  Neither frontend nor backend are running!
        echo Please run start-app.bat first to start the services.
        echo.
        set /p "start_now=Start the application now? (y/N): "
        if /i "%start_now%"=="y" (
            echo Starting application...
            call start-app.bat
            exit /b 0
        ) else (
            echo.
            echo You can still open the URLs, but they won't work until services are started.
            echo.
        )
    )
)

echo 🌐 Application URLs:
echo.
echo 1. Frontend (Main Application)
echo 2. Backend API Health Check
echo 3. Backend API Documentation
echo 4. All URLs at once
echo 5. Exit
echo.

:menu
set /p "choice=Select option (1-5): "

if "%choice%"=="1" goto :frontend
if "%choice%"=="2" goto :backend_health
if "%choice%"=="3" goto :backend_api
if "%choice%"=="4" goto :all_urls
if "%choice%"=="5" goto :exit

echo Invalid option, please try again.
echo.
goto :menu

:frontend
echo.
echo 🎯 Opening Frontend Application...
echo URL: http://localhost:3000
echo.
start http://localhost:3000
echo ✅ Frontend opened in default browser
if "%frontend_running%"=="false" (
    echo ⚠️  Note: Frontend is not running - you'll see an error page
)
echo.
set /p "return=Press Enter to return to menu..."
goto :menu

:backend_health
echo.
echo 🎯 Opening Backend Health Check...
echo URL: http://localhost:8000/api/health
echo.
start http://localhost:8000/api/health
echo ✅ Backend health check opened in default browser
if "%backend_running%"=="false" (
    echo ⚠️  Note: Backend is not running - you'll see an error page
)
echo.
set /p "return=Press Enter to return to menu..."
goto :menu

:backend_api
echo.
echo 🎯 Opening Backend API...
echo URL: http://localhost:8000/api/v1
echo.
start http://localhost:8000/api/v1
echo ✅ Backend API opened in default browser
if "%backend_running%"=="false" (
    echo ⚠️  Note: Backend is not running - you'll see an error page
)
echo.
set /p "return=Press Enter to return to menu..."
goto :menu

:all_urls
echo.
echo 🎯 Opening all application URLs...
echo.

echo Opening Frontend...
start http://localhost:3000

timeout /t 2 /nobreak >nul

echo Opening Backend Health Check...
start http://localhost:8000/api/health

timeout /t 2 /nobreak >nul

echo Opening Backend API...
start http://localhost:8000/api/v1

echo.
echo ✅ All URLs opened in separate browser tabs

if "%frontend_running%"=="false" (
    echo ⚠️  Note: Frontend is not running - you'll see error pages
)
if "%backend_running%"=="false" (
    echo ⚠️  Note: Backend is not running - you'll see error pages
)

echo.
echo 💡 Quick Test URLs:
echo   - Frontend: Should show the Amaso dashboard
echo   - Health:   Should show JSON with system status
echo   - API:      Should show available API endpoints
echo.

set /p "return=Press Enter to return to menu..."
goto :menu

:exit
echo.
echo 📋 Quick Reference:
echo   Frontend:    http://localhost:3000
echo   Backend:     http://localhost:8000
echo   API:         http://localhost:8000/api/v1
echo   Health:      http://localhost:8000/api/health
echo.
echo Goodbye!
exit /b 0