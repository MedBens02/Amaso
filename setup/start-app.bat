@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Amaso - Demarrage
color 0a

set "ROOT=%~dp0.."
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"

echo.
echo =====================================================
echo    AMASO - Demarrage de l'application
echo =====================================================
echo.

REM ---------------------------------------------------------------
REM L'application ne peut pas demarrer si install.bat n'a jamais ete
REM lance : les dependances ne sont pas dans le depot.
REM ---------------------------------------------------------------
if not exist "%BACKEND%\vendor\autoload.php" (
    echo   [X] Les dependances PHP ne sont pas installees.
    echo       Lancez d'abord install.bat
    echo.
    pause
    exit /b 1
)

if not exist "%FRONTEND%\node_modules" (
    echo   [X] Les dependances JavaScript ne sont pas installees.
    echo       Lancez d'abord install.bat
    echo.
    pause
    exit /b 1
)

REM ---------------------------------------------------------------
REM MySQL doit tourner avant le backend, sinon chaque page renvoie
REM une erreur de connexion sans expliquer pourquoi.
REM ---------------------------------------------------------------
netstat -an | findstr ":3306" | findstr "LISTENING" >nul 2>&1
if errorlevel 1 (
    echo   [X] MySQL ne repond pas sur le port 3306.
    echo       Ouvrez le panneau XAMPP et demarrez MySQL, puis relancez.
    echo.
    pause
    exit /b 1
)
echo   [OK] MySQL repond
echo.

REM ---------------------------------------------------------------
REM Arreter proprement une instance precedente. On ne tue que ce qui
REM ecoute sur nos deux ports : un "taskkill /IM php.exe" arreterait
REM aussi le PHP d'Apache dans XAMPP.
REM ---------------------------------------------------------------
echo Arret des instances precedentes...
call "%~dp0stop-app.bat" --quiet
echo.

REM ---------------------------------------------------------------
REM Backend : uniquement le serveur web. "composer dev" lance en plus
REM un worker de file d'attente, un lecteur de logs et un Vite dont
REM cette application n'a pas l'usage.
REM ---------------------------------------------------------------
echo [1/2] Demarrage du backend Laravel...
start "Amaso Backend" /min /d "%BACKEND%" cmd /c "php artisan serve --host=127.0.0.1 --port=8000"

echo [2/2] Demarrage du frontend Next.js...
start "Amaso Frontend" /min /d "%FRONTEND%" cmd /c "npm run dev"
echo.

REM ---------------------------------------------------------------
REM Attendre que les ports repondent vraiment, plutot que de compter
REM des secondes au hasard : le premier demarrage de Next.js est long.
REM ---------------------------------------------------------------
echo Demarrage en cours ^(cela peut prendre une minute la premiere fois^)...
echo.

set "BACKEND_UP="
set "FRONTEND_UP="

for /L %%i in (1,1,90) do (
    if not defined BACKEND_UP (
        netstat -an | findstr ":8000" | findstr "LISTENING" >nul 2>&1
        if not errorlevel 1 (
            set "BACKEND_UP=1"
            echo   [OK] Backend pret    - http://localhost:8000
        )
    )
    if not defined FRONTEND_UP (
        netstat -an | findstr ":3000" | findstr "LISTENING" >nul 2>&1
        if not errorlevel 1 (
            set "FRONTEND_UP=1"
            echo   [OK] Frontend pret   - http://localhost:3000
        )
    )
    if defined BACKEND_UP if defined FRONTEND_UP goto :ready
    timeout /t 1 /nobreak >nul
)

REM ---------------------------------------------------------------
REM Delai depasse : dire lequel des deux manque, et ou regarder.
REM ---------------------------------------------------------------
echo.
if not defined BACKEND_UP  echo   [X] Le backend n'a pas demarre  - voir la fenetre "Amaso Backend"
if not defined FRONTEND_UP echo   [X] Le frontend n'a pas demarre - voir la fenetre "Amaso Frontend"
echo.
echo   Les fenetres sont reduites dans la barre des taches : ouvrez-les
echo   pour lire le message d'erreur.
echo.
pause
exit /b 1

:ready
echo.
echo =====================================================
echo    Application demarree
echo =====================================================
echo.
echo   Interface     http://localhost:3000
echo   API           http://localhost:8000
echo.
echo   Pour arreter  stop-app.bat
echo.
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo   Le navigateur s'ouvre. Cette fenetre peut etre fermee.
echo.
timeout /t 8 >nul
exit /b 0
