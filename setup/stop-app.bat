@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

REM Appele avec --quiet par start-app.bat : on nettoie sans afficher
REM de banniere ni attendre de touche.
set "QUIET="
if /I "%~1"=="--quiet" set "QUIET=1"

if not defined QUIET (
    title Amaso - Arret
    color 0c
    echo.
    echo =====================================================
    echo    AMASO - Arret de l'application
    echo =====================================================
    echo.
)

REM ---------------------------------------------------------------
REM On arrete uniquement les processus qui ecoutent sur nos ports.
REM Un "taskkill /IM php.exe" ou "/IM node.exe" arreterait aussi le
REM PHP d'Apache dans XAMPP et tout autre projet Node ouvert.
REM ---------------------------------------------------------------
call :kill_port 8000 "Backend Laravel"
call :kill_port 3000 "Frontend Next.js"

REM Les fenetres cmd hotes survivent a l'arret de leur processus fils.
taskkill /FI "WINDOWTITLE eq Amaso Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Amaso Frontend*" /F >nul 2>&1

if not defined QUIET (
    echo.
    echo   MySQL reste demarre dans XAMPP.
    echo.
    timeout /t 4 >nul
)
exit /b 0

REM ---------------------------------------------------------------
REM :kill_port PORT LIBELLE
REM ---------------------------------------------------------------
:kill_port
set "PORT=%~1"
set "LABEL=%~2"
set "FOUND="

for /f "tokens=5" %%p in ('netstat -ano ^| findstr /R /C:":%PORT% .*LISTENING"') do (
    if not "%%p"=="0" (
        taskkill /F /PID %%p >nul 2>&1
        set "FOUND=1"
    )
)

if not defined QUIET (
    if defined FOUND (
        echo   [OK] %LABEL% arrete ^(port %PORT%^)
    ) else (
        echo   [--] %LABEL% n'etait pas demarre
    )
)
exit /b 0
