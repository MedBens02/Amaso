@echo off
echo.
echo =============================================
echo         Amaso App - Log Viewer
echo =============================================
echo.

echo 📋 Available logs and information:
echo.
echo 1. Laravel Backend Logs
echo 2. Check Backend Status (port 8000)
echo 3. Check Frontend Status (port 3000)
echo 4. View Running Processes
echo 5. Check Database Connection
echo 6. View Port Usage
echo 7. Open Log Files in Text Editor
echo 8. Real-time Log Monitor (if services running)
echo 9. Exit
echo.

:menu
set /p "choice=Select option (1-9): "

if "%choice%"=="1" goto :backend_logs
if "%choice%"=="2" goto :backend_status
if "%choice%"=="3" goto :frontend_status
if "%choice%"=="4" goto :processes
if "%choice%"=="5" goto :database_check
if "%choice%"=="6" goto :port_usage
if "%choice%"=="7" goto :open_logs
if "%choice%"=="8" goto :realtime_monitor
if "%choice%"=="9" goto :exit

echo Invalid option, please try again.
echo.
goto :menu

:backend_logs
echo.
echo 📄 Laravel Backend Logs:
echo =============================================
if exist "..\backend\storage\logs\laravel.log" (
    echo Latest log entries:
    echo.
    powershell -command "Get-Content '..\backend\storage\logs\laravel.log' -Tail 20"
) else (
    echo ❌ Laravel log file not found
    echo Expected location: backend\storage\logs\laravel.log
)
echo.
echo Press any key to return to menu...
pause >nul
goto :menu

:backend_status
echo.
echo 🔍 Backend Status (Laravel on port 8000):
echo =============================================
echo.

REM Check if port 8000 is in use
netstat -an | findstr ":8000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Port 8000 is in use (Backend likely running)
    echo.
    echo Trying to reach backend health endpoint...
    curl -s http://localhost:8000/api/health 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Backend health check successful
    ) else (
        echo ❌ Backend health check failed
        echo Backend may be starting up or has errors
    )
) else (
    echo ❌ Port 8000 is not in use (Backend not running)
    echo Run start-app.bat to start the backend
)
echo.
echo Press any key to return to menu...
pause >nul
goto :menu

:frontend_status
echo.
echo 🔍 Frontend Status (Next.js on port 3000):
echo =============================================
echo.

REM Check if port 3000 is in use
netstat -an | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Port 3000 is in use (Frontend likely running)
    echo.
    echo Trying to reach frontend...
    curl -s -o nul -w "HTTP Status: %%{http_code}" http://localhost:3000 2>nul
    echo.
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Frontend is responding
    ) else (
        echo ❌ Frontend is not responding properly
    )
) else (
    echo ❌ Port 3000 is not in use (Frontend not running)
    echo Run start-app.bat to start the frontend
)
echo.
echo Press any key to return to menu...
pause >nul
goto :menu

:processes
echo.
echo 🔍 Running Processes Related to Amaso:
echo =============================================
echo.
echo PHP processes:
tasklist | findstr "php.exe" 2>nul || echo No PHP processes found

echo.
echo Node.js processes:
tasklist | findstr "node.exe" 2>nul || echo No Node.js processes found

echo.
echo MySQL processes:
tasklist | findstr "mysql" 2>nul || echo No MySQL processes found

echo.
echo Press any key to return to menu...
pause >nul
goto :menu

:database_check
echo.
echo 🔍 Database Connection Check:
echo =============================================
echo.

mysql --user=root --execute="SELECT 'Database connection successful!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL connection successful
    echo.
    echo Checking Amaso database:
    mysql --user=root --execute="USE amaso; SELECT COUNT(*) as 'Tables in amaso' FROM information_schema.tables WHERE table_schema='amaso';" 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Amaso database accessible
    ) else (
        echo ❌ Amaso database not found or not accessible
    )
) else (
    echo ❌ MySQL connection failed
    echo Make sure MySQL is running (use start-mysql.bat)
)
echo.
echo Press any key to return to menu...
pause >nul
goto :menu

:port_usage
echo.
echo 🔍 Port Usage Check:
echo =============================================
echo.
echo Checking application ports:
echo.
netstat -an | findstr ":3000" >nul 2>&1 && echo ✅ Port 3000 (Frontend): IN USE || echo ❌ Port 3000 (Frontend): FREE
netstat -an | findstr ":8000" >nul 2>&1 && echo ✅ Port 8000 (Backend): IN USE || echo ❌ Port 8000 (Backend): FREE  
netstat -an | findstr ":3306" >nul 2>&1 && echo ✅ Port 3306 (MySQL): IN USE || echo ❌ Port 3306 (MySQL): FREE

echo.
echo All listening ports:
netstat -an | findstr "LISTENING" | findstr ":3000\|:8000\|:3306"
echo.
echo Press any key to return to menu...
pause >nul
goto :menu

:open_logs
echo.
echo 📂 Opening Log Files:
echo =============================================
echo.

if exist "..\backend\storage\logs\laravel.log" (
    echo Opening Laravel log file...
    start notepad "..\backend\storage\logs\laravel.log"
    echo ✅ Laravel log opened in Notepad
) else (
    echo ❌ Laravel log file not found
)

if exist "..\frontend\.next\trace" (
    echo Next.js trace files available in: ..\frontend\.next\trace
) else (
    echo ℹ️  Next.js trace files not found (normal if not in debug mode)
)

echo.
echo Press any key to return to menu...
pause >nul
goto :menu

:realtime_monitor
echo.
echo 📊 Real-time Log Monitor:
echo =============================================
echo.
echo This will show real-time logs from the backend.
echo Press Ctrl+C to stop monitoring and return to menu.
echo.
pause

if exist "..\backend\storage\logs\laravel.log" (
    echo Monitoring Laravel logs (press Ctrl+C to stop):
    echo.
    powershell -command "Get-Content '..\backend\storage\logs\laravel.log' -Wait -Tail 10"
) else (
    echo ❌ Laravel log file not found
    echo Make sure the backend has been started at least once
)

echo.
goto :menu

:exit
echo.
echo Goodbye!
exit /b 0