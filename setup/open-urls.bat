@echo off
title Amaso App - Quick Access
color 0b
echo.
echo =============================================
echo      🌐 Amaso App - Quick Access 🌐
echo =============================================
echo.

REM Check if services are running
netstat -an | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "frontend_running=true"
) else (
    set "frontend_running=false"
)

netstat -an | findstr ":8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "backend_running=true"
) else (
    set "backend_running=false"
)

if "%frontend_running%"=="false" (
    if "%backend_running%"=="false" (
        echo ⚠️  Services not running - Starting them first...
        echo.
        call start-app.bat
        echo.
        echo ⏳ Services should now be starting...
        timeout /t 5 /nobreak >nul
    )
)

echo 🌐 Opening Amaso Application...
echo.
echo 🎯 Frontend: http://localhost:3000
start http://localhost:3000

if "%frontend_running%"=="true" (
    echo ✅ Application opened in your browser
) else (
    echo ⏳ App is starting - browser will show loading until ready
)

echo.
echo 💡 Quick Reference:
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:8000  
echo   API:       http://localhost:8000/api/v1
echo   Health:    http://localhost:8000/api/health
echo.
echo Closing in 5 seconds...
timeout /t 5 >nul
exit