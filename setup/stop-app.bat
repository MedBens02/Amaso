@echo off
echo.
echo =============================================
echo       Amaso App - Stopping Services
echo =============================================
echo.

echo 🛑 Stopping all Amaso services...
echo.

REM Stop processes using the specific ports
echo [1/3] Stopping Laravel Backend (port 8000)...

REM Find and kill processes using port 8000
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":8000"') do (
    if not "%%i"=="0" (
        echo    Stopping process ID: %%i
        taskkill /PID %%i /F >nul 2>&1
    )
)

REM Alternative method - kill PHP artisan serve processes
tasklist | findstr "php.exe" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    Stopping PHP processes...
    taskkill /IM php.exe /F >nul 2>&1
)

echo ✅ Laravel Backend stopped

echo [2/3] Stopping Next.js Frontend (port 3000)...

REM Find and kill processes using port 3000
for /f "tokens=5" %%i in ('netstat -ano ^| findstr ":3000"') do (
    if not "%%i"=="0" (
        echo    Stopping process ID: %%i
        taskkill /PID %%i /F >nul 2>&1
    )
)

REM Alternative method - kill Node.js processes (be careful with this)
REM We'll try to be more specific and only kill processes with "next" in command line
wmic process where "name='node.exe' and commandline like '%next%'" delete >nul 2>&1

echo ✅ Next.js Frontend stopped

echo [3/3] Closing service windows...

REM Close the named command windows we opened
taskkill /FI "WINDOWTITLE eq Amaso Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Amaso Frontend*" /F >nul 2>&1

echo ✅ Service windows closed

echo.
echo 📊 Checking remaining processes...

REM Check if any services are still running
netstat -an | findstr ":8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Warning: Something is still using port 8000
) else (
    echo ✅ Port 8000 is free
)

netstat -an | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ⚠️  Warning: Something is still using port 3000
) else (
    echo ✅ Port 3000 is free
)

echo.
echo =============================================
echo         🛑 Services Stopped! 🛑
echo =============================================
echo.
echo 📋 What was stopped:
echo   ✅ Laravel Backend (port 8000)
echo   ✅ Next.js Frontend (port 3000)
echo   ✅ Associated command windows
echo.
echo 💡 Notes:
echo   - MySQL database is still running (if you started it)
echo   - To start services again, run: start-app.bat
echo   - Your data is preserved and safe
echo.

REM Optional MySQL stop (ask user)
set /p "stop_mysql=🗄️ Stop MySQL service too? (y/N): "
if /i "%stop_mysql%"=="y" (
    echo.
    echo 🛑 Stopping MySQL...
    
    REM Try to stop MySQL service
    net stop mysql >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ MySQL service stopped
    ) else (
        echo ⚠️  MySQL service may not be running as a Windows service
        echo If you're using XAMPP, please stop MySQL from XAMPP Control Panel
    )
)

echo.
pause