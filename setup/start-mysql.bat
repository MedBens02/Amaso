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
    
    REM Check if MySQL is already running
    tasklist | findstr "mysqld.exe" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ MySQL process is already running
        goto :test_connection
    )
    
    echo 🔧 XAMPP MySQL Management:
    echo   1. Open XAMPP Control Panel (Recommended)
    echo   2. Try to start MySQL directly
    echo   3. Manual troubleshooting
    echo.
    set /p "xampp_choice=Choose option (1-3): "
    
    if "%xampp_choice%"=="1" (
        echo Opening XAMPP Control Panel...
        if exist "C:\xampp\xampp-control.exe" (
            start "" "C:\xampp\xampp-control.exe"
            echo ✅ XAMPP Control Panel opened
            echo.
            echo 📋 XAMPP Instructions:
            echo 1. In XAMPP Control Panel, look for 'MySQL' row
            echo 2. Click the 'Start' button next to MySQL
            echo 3. Wait until the MySQL row turns GREEN
            echo 4. If it shows 'Running' in green, MySQL is ready
            echo.
            echo 🚨 Common XAMPP Issues:
            echo - Port 3306 already in use: Stop other MySQL services first
            echo - Permission errors: Run XAMPP as Administrator
            echo - Firewall blocking: Allow MySQL through Windows Firewall
            echo.
            pause
        ) else (
            echo ❌ XAMPP Control Panel not found at C:\xampp\xampp-control.exe
            echo Trying common alternative locations...
            if exist "C:\xampp\xampp_control.exe" (
                start "" "C:\xampp\xampp_control.exe"
                echo ✅ Found alternative XAMPP Control Panel
            ) else (
                echo ❌ Could not find XAMPP Control Panel
                echo Please navigate to your XAMPP installation and run xampp-control.exe
            )
        )
    ) else if "%xampp_choice%"=="2" (
        echo Attempting to start MySQL directly...
        echo.
        
        REM Try to start MySQL service through XAMPP
        if exist "C:\xampp\mysql_start.bat" (
            echo Running XAMPP MySQL start script...
            call "C:\xampp\mysql_start.bat"
            timeout /t 3 /nobreak >nul
        ) else (
            echo Starting MySQL server directly...
            cd /d "C:\xampp\mysql\bin"
            start "XAMPP MySQL Server" cmd /c "mysqld.exe --console --bind-address=127.0.0.1"
            echo ✅ MySQL started in separate window
            timeout /t 5 /nobreak >nul
            cd /d "%~dp0"
        )
        
    ) else if "%xampp_choice%"=="3" (
        echo.
        echo 🔧 XAMPP MySQL Troubleshooting Guide:
        echo.
        echo 1. Check if port 3306 is free:
        echo    netstat -an ^| findstr :3306
        echo.
        echo 2. Stop any existing MySQL services:
        echo    net stop mysql
        echo    net stop mysql80
        echo.
        echo 3. Run XAMPP as Administrator:
        echo    Right-click XAMPP Control Panel ^> Run as Administrator
        echo.
        echo 4. Check XAMPP MySQL error log:
        echo    C:\xampp\mysql\data\*.err
        echo.
        echo 5. Reset MySQL password if needed:
        echo    Use XAMPP Shell or phpMyAdmin
        echo.
        pause
    )
    
    goto :test_connection
) else (
    echo ❌ XAMPP MySQL not found at C:\xampp\mysql\bin\mysqld.exe
    echo.
    echo 🔍 Checking alternative XAMPP locations...
    
    REM Check alternative XAMPP locations
    if exist "D:\xampp\mysql\bin\mysqld.exe" (
        echo 📱 Found XAMPP at D:\xampp\
        echo Please update the script with your XAMPP path
    ) else if exist "C:\Program Files\XAMPP\mysql\bin\mysqld.exe" (
        echo 📱 Found XAMPP at C:\Program Files\XAMPP\
        echo Please update the script with your XAMPP path
    ) else (
        echo ❌ XAMPP not found in common locations
        echo Please install XAMPP from https://www.apachefriends.org/
    )
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

REM Wait a moment for MySQL to fully start
timeout /t 3 /nobreak >nul

REM Try connection with no password (XAMPP default)
mysql --user=root --execute="SELECT 'MySQL is working!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL connection successful! (No password)
    echo.
    echo 📊 MySQL server information:
    mysql --user=root --execute="SELECT VERSION() as 'MySQL Version';" 2>nul
    mysql --user=root --execute="SHOW DATABASES;" 2>nul | findstr "amaso" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ Amaso database found
    ) else (
        echo ⚠️  Amaso database not found - you may need to run setup.bat or reset-database.bat
    )
    echo.
    echo 💡 XAMPP Default Settings Detected:
    echo   Username: root
    echo   Password: (empty)
    echo   Host: localhost:3306
    goto :end
)

REM Try with password prompt if no-password failed
echo ❌ Connection with no password failed
echo.
echo 🔑 Trying connection with password...
echo (XAMPP default is no password, but yours might be different)
mysql --user=root --password --execute="SELECT 'MySQL is working!' as status;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MySQL connection successful! (With password)
    goto :end
)

REM Connection failed - provide troubleshooting
echo ❌ MySQL connection failed with both no password and password
echo.
echo 🔧 XAMPP MySQL Connection Troubleshooting:
echo.
echo 1. 🚀 Make sure MySQL is running in XAMPP Control Panel:
echo    - Open XAMPP Control Panel
echo    - MySQL row should be GREEN and show "Running"
echo    - Port should show 3306
echo.
echo 2. 🔍 Check if MySQL process is running:
tasklist | findstr "mysqld.exe" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✅ mysqld.exe process is running
) else (
    echo    ❌ mysqld.exe process is NOT running
    echo    → Start MySQL from XAMPP Control Panel
)
echo.
echo 3. 🔌 Check if port 3306 is listening:
netstat -an | findstr ":3306" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Port 3306 is in use (MySQL should be listening)
) else (
    echo    ❌ Port 3306 is not in use
    echo    → MySQL is not running or using different port
)
echo.
echo 4. 💡 Common XAMPP Solutions:
echo    - Restart XAMPP Control Panel as Administrator
echo    - Stop and start MySQL service in XAMPP
echo    - Check Windows Firewall settings
echo    - Verify no other MySQL services are running
echo.
echo 5. 🔑 Default XAMPP Credentials:
echo    - Username: root
echo    - Password: (leave empty)
echo    - Host: localhost or 127.0.0.1
echo    - Port: 3306
echo.
echo 6. 📝 Test connection manually:
echo    mysql -u root -h localhost -P 3306
echo.

:end

echo.
pause