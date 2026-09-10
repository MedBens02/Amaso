@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Amaso - Installation
color 0b

set "ROOT=%~dp0.."
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"

echo.
echo =====================================================
echo    AMASO - Installation ^(a lancer une seule fois^)
echo =====================================================
echo.

REM ---------------------------------------------------------------
REM 1. Verification des prerequis
REM ---------------------------------------------------------------
echo [1/6] Verification des prerequis...
echo.

set "MISSING="

where php >nul 2>&1
if errorlevel 1 (
    echo   [X] PHP introuvable          - installez XAMPP ^(https://www.apachefriends.org^)
    set "MISSING=1"
) else (
    for /f "tokens=2 delims= " %%v in ('php -r "echo 'PHP '.PHP_VERSION;"') do echo   [OK] PHP %%v
)

where composer >nul 2>&1
if errorlevel 1 (
    echo   [X] Composer introuvable     - https://getcomposer.org/Composer-Setup.exe
    set "MISSING=1"
) else (
    echo   [OK] Composer
)

where node >nul 2>&1
if errorlevel 1 (
    echo   [X] Node.js introuvable      - https://nodejs.org ^(version 20 ou plus^)
    set "MISSING=1"
) else (
    for /f %%v in ('node -v') do echo   [OK] Node.js %%v
)

where npm >nul 2>&1
if errorlevel 1 (
    echo   [X] npm introuvable          - reinstallez Node.js
    set "MISSING=1"
) else (
    echo   [OK] npm
)

if defined MISSING (
    echo.
    echo   Installez les elements marques [X] puis relancez ce script.
    echo.
    pause
    exit /b 1
)

REM L'export Excel a besoin de l'extension GD. Sans elle les telechargements
REM .xlsx renvoient une erreur 500 - autant le dire maintenant qu'apres.
php -r "exit(extension_loaded('gd') ? 0 : 1);" >nul 2>&1
if errorlevel 1 (
    echo   [!] Extension PHP "gd" desactivee.
    echo       Les exports Excel ne fonctionneront pas sans elle.
    echo       Ouvrez php.ini et enlevez le point-virgule devant extension=gd
    echo.
)

echo.

REM ---------------------------------------------------------------
REM 2. Dependances PHP
REM ---------------------------------------------------------------
echo [2/6] Installation des dependances PHP ^(quelques minutes^)...
pushd "%BACKEND%"
call composer install --no-interaction --prefer-dist
if errorlevel 1 (
    echo.
    echo   [X] composer install a echoue. Lisez le message ci-dessus.
    popd
    pause
    exit /b 1
)
echo   [OK] Dependances PHP installees
popd
echo.

REM ---------------------------------------------------------------
REM 3. Configuration du backend
REM ---------------------------------------------------------------
echo [3/6] Configuration du backend...
if not exist "%BACKEND%\.env" (
    copy "%BACKEND%\.env.example" "%BACKEND%\.env" >nul
    echo   [OK] Fichier .env cree
) else (
    echo   [OK] Fichier .env deja present ^(conserve^)
)

pushd "%BACKEND%"
findstr /B /C:"APP_KEY=base64:" .env >nul 2>&1
if errorlevel 1 (
    call php artisan key:generate --force
    echo   [OK] Cle d'application generee
) else (
    echo   [OK] Cle d'application deja definie
)
popd
echo.

REM ---------------------------------------------------------------
REM 4. Base de donnees
REM ---------------------------------------------------------------
echo [4/6] Base de donnees
echo.
echo   Verifiez que MySQL tourne dans XAMPP avant de continuer.
echo.
echo   Le fichier backend\.env doit contenir vos identifiants MySQL :
echo     DB_DATABASE=amaso
echo     DB_USERNAME=root
echo     DB_PASSWORD=
echo.
echo   Choisissez comment remplir la base :
echo     1. Donnees de demonstration ^(recommande pour tester^)
echo     2. Base vide, structure seulement ^(pour un usage reel^)
echo     3. Ne rien faire maintenant
echo.
set "DBCHOICE="
set /p "DBCHOICE=Votre choix [1/2/3] : "

pushd "%BACKEND%"
if "%DBCHOICE%"=="1" (
    call php artisan migrate:fresh --force
    if errorlevel 1 goto :dbfail
    call php artisan db:seed --force
    if errorlevel 1 goto :dbfail
    call php artisan db:seed --class=DemoDataSeeder --force
    if errorlevel 1 goto :dbfail
    echo   [OK] Base remplie avec les donnees de demonstration
)
if "%DBCHOICE%"=="2" (
    call php artisan migrate --force
    if errorlevel 1 goto :dbfail
    call php artisan db:seed --force
    if errorlevel 1 goto :dbfail
    echo   [OK] Structure creee, donnees de reference en place
)
if "%DBCHOICE%"=="3" (
    echo   [!] Base non initialisee - a faire avant d'utiliser l'application
)
popd
echo.

REM ---------------------------------------------------------------
REM 5. Dependances JavaScript
REM ---------------------------------------------------------------
echo [5/6] Installation des dependances JavaScript ^(quelques minutes^)...
pushd "%FRONTEND%"
call npm install
if errorlevel 1 (
    echo.
    echo   [X] npm install a echoue. Lisez le message ci-dessus.
    popd
    pause
    exit /b 1
)
echo   [OK] Dependances JavaScript installees
popd
echo.

REM ---------------------------------------------------------------
REM 6. Configuration du frontend
REM ---------------------------------------------------------------
echo [6/6] Configuration du frontend...
if not exist "%FRONTEND%\.env.local" (
    copy "%~dp0.env.local.example" "%FRONTEND%\.env.local" >nul
    echo   [OK] Fichier .env.local cree
) else (
    echo   [OK] Fichier .env.local deja present ^(conserve^)
)
echo.

echo =====================================================
echo    Installation terminee
echo =====================================================
echo.
echo   Lancez l'application avec :  start-app.bat
echo.
if "%DBCHOICE%"=="1" (
    echo   Comptes de demonstration ^(mot de passe : password^) :
    echo     admin@amaso.org        Administrateur
    echo     accountant@amaso.org   Comptable
    echo     social@amaso.org       Assistant social
    echo.
)
pause
exit /b 0

:dbfail
popd
echo.
echo   [X] L'initialisation de la base a echoue.
echo       Verifiez que MySQL tourne et que backend\.env contient
echo       les bons identifiants, puis relancez ce script.
echo.
pause
exit /b 1
