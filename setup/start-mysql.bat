@echo off
echo.
echo =============================================
echo       Amaso App - MySQL Startup Helper
echo =============================================
echo.

echo 🔍 Detecting MySQL installation...
echo.

REM Check if MySQL is already running
mysql --user=root --execute="SELECT 1;" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL is already running and accessible!
    echo.
    goto :test_connection
)

echo 🔧 MySQL is not responding. Let's try to start it...
echo.

REM Method 1: Try to start MySQL as Windows service
echo [Method 1] Trying to start MySQL Windows service...
net start mysql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL service started successfully!
    timeout /t 3 /nobreak >nul
    goto :test_connection
) else (
    echo ❌ MySQL service not found or failed to start
)

REM Method 2: Try to start MySQL80 service (common name)
echo [Method 2] Trying to start MySQL80 service...
net start MySQL80 >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL80 service started successfully!
    timeout /t 3 /nobreak >nul
    goto :test_connection
) else (
    echo ❌ MySQL80 service not found or failed to start
)

REM Method 3: Check for XAMPP
echo [Method 3] Checking for XAMPP installation...

if exist "C:\xampp\mysql\bin\mysqld.exe" (
    echo 📱 XAMPP MySQL found!
    echo.
    echo 🔧 XAMPP MySQL Management:
    echo   1. Open XAMPP Control Panel
    echo   2. Start XAMPP and then start MySQL service
    echo   3. Manual command line start
    echo.
    set /p "xampp_choice=Choose option (1-3): "
    
    if "%xampp_choice%"=="1" (
        echo Opening XAMPP Control Panel...
        if exist "C:\xampp\xampp-control.exe" (
            start "" "C:\xampp\xampp-control.exe"
            echo ✅ XAMPP Control Panel opened
            echo Please start MySQL from the control panel and press any key to continue...
            pause >nul
        ) else (
            echo ❌ XAMPP Control Panel not found at expected location
        )
    ) else if "%xampp_choice%"=="2" (
        echo Starting XAMPP stack...
        if exist "C:\xampp\xampp_start.exe" (
            start "" "C:\xampp\xampp_start.exe"
            echo ✅ XAMPP stack started
            timeout /t 5 /nobreak >nul
        ) else (
            echo ❌ XAMPP start script not found
        )
    ) else if "%xampp_choice%"=="3" (
        echo Starting MySQL manually...
        cd /d "C:\xampp\mysql\bin"
        start "MySQL Server" mysqld.exe --console
        echo ✅ MySQL started in separate window
        timeout /t 5 /nobreak >nul
        cd /d "%~dp0"
    )
    
    goto :test_connection
) else (
    echo ❌ XAMPP MySQL not found
)

REM Method 4: Manual service search
echo [Method 4] Searching for MySQL services...
sc query type=service | findstr /i mysql >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo 📋 Found MySQL-related services:
    sc query type=service | findstr /i mysql
    echo.
    echo Try starting one of these services manually:
    echo net start [service_name]
) else (
    echo ❌ No MySQL services found
)

echo.
echo 🆘 Manual Setup Required
echo.
echo If MySQL is not starting automatically, please:
echo.
echo 📋 For XAMPP users:
echo   1. Open XAMPP Control Panel
echo   2. Click 'Start' next to MySQL
echo   3. Wait for it to show as running (green)
echo.
echo 📋 For standalone MySQL:
echo   1. Make sure MySQL is installed
echo   2. Start MySQL service from Services.msc
echo   3. Or run: net start mysql
echo.
echo 📋 Alternative installation:
echo   - Install MySQL from: https://dev.mysql.com/downloads/mysql/
echo   - Or install XAMPP from: https://www.apachefriends.org/
echo.
set /p "manual_done=Press Enter after starting MySQL manually..."

:test_connection
echo.
echo 🧪 Testing MySQL connection...
mysql --user=root --execute="SELECT 'MySQL is working!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL connection successful!
    echo.
    echo 📊 MySQL server information:
    mysql --user=root --execute="SELECT VERSION() as 'MySQL Version';" 2>nul
    mysql --user=root --execute="SHOW DATABASES;" 2>nul | findstr "amaso" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Amaso database found
    ) else (
        echo ⚠️  Amaso database not found - you may need to run setup.bat or reset-database.bat
    )
) else (
    echo ❌ MySQL connection failed
    echo.
    echo 🔧 Common issues:
    echo   - MySQL service not running
    echo   - Incorrect root password
    echo   - MySQL not installed
    echo   - Port 3306 blocked by firewall
    echo.
    echo Please resolve the MySQL connection issue and try again.
)

echo.
pause