@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title Amaso - Mise a jour
color 0b

set "ROOT=%~dp0.."
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"

echo.
echo =====================================================
echo    AMASO - Mise a jour
echo =====================================================
echo.

where git >nul 2>&1
if errorlevel 1 (
    echo   [X] Git n'est pas installe - https://git-scm.com
    echo.
    pause
    exit /b 1
)

if not exist "%ROOT%\.git" (
    echo   [X] Ce dossier n'est pas un depot Git.
    echo       La mise a jour automatique n'est pas possible ; recuperez
    echo       la nouvelle version manuellement.
    echo.
    pause
    exit /b 1
)

REM ---------------------------------------------------------------
REM 1. Arreter l'application avant de toucher aux fichiers
REM ---------------------------------------------------------------
echo [1/5] Arret de l'application...
call "%~dp0stop-app.bat" --quiet
echo   [OK] Services arretes
echo.

pushd "%ROOT%"

REM ---------------------------------------------------------------
REM 2. Recuperer le code
REM
REM Les fichiers de configuration (.env, .env.local) ne sont pas
REM suivis par Git : ils ne risquent rien. On met de cote d'eventuelles
REM modifications locales, et surtout on les RESTAURE apres - l'ancien
REM script faisait le "stash" sans jamais le "pop", ce qui donnait
REM l'impression que le travail local avait disparu.
REM ---------------------------------------------------------------
echo [2/5] Recuperation de la nouvelle version...

REM "git diff HEAD" ignore les fichiers non suivis, qui sont pourtant
REM la cause la plus frequente d'un "pull" refuse. On teste donc la
REM sortie de "git status --porcelain", qui les inclut.
set "DIRTY="
set "STASHED="
git status --porcelain > "%TEMP%\amaso-git-status.txt" 2>nul
for %%A in ("%TEMP%\amaso-git-status.txt") do if %%~zA GTR 0 set "DIRTY=1"
del "%TEMP%\amaso-git-status.txt" >nul 2>&1

if defined DIRTY (
    git stash push -u -m "amaso-update-app" >nul 2>&1
    if not errorlevel 1 (
        set "STASHED=1"
        echo   [!] Modifications locales mises de cote
    )
)

for /f "tokens=*" %%b in ('git rev-parse --abbrev-ref HEAD') do set "BRANCH=%%b"
git pull origin !BRANCH!
if errorlevel 1 (
    echo.
    echo   [X] "git pull" a echoue - lisez le message ci-dessus.
    if defined STASHED (
        git stash pop
        echo   [OK] Modifications locales restaurees
    )
    popd
    pause
    exit /b 1
)
echo   [OK] Code mis a jour ^(branche !BRANCH!^)

if defined STASHED (
    git stash pop
    if errorlevel 1 (
        echo   [!] Vos modifications locales sont dans "git stash" et
        echo       entrent en conflit avec la nouvelle version.
        echo       Recuperez-les avec : git stash pop
    ) else (
        echo   [OK] Modifications locales restaurees
    )
)
popd
echo.

REM ---------------------------------------------------------------
REM 3. Dependances PHP
REM
REM Une mise a jour ajoute regulierement une bibliotheque ; sans cette
REM etape l'application demarre puis echoue sur la premiere page qui
REM s'en sert.
REM ---------------------------------------------------------------
echo [3/5] Mise a jour des dependances PHP...
pushd "%BACKEND%"
call composer install --no-interaction --prefer-dist
if errorlevel 1 (
    echo   [X] composer install a echoue.
    popd
    pause
    exit /b 1
)
echo   [OK] Dependances PHP a jour
popd
echo.

REM ---------------------------------------------------------------
REM 4. Dependances JavaScript
REM ---------------------------------------------------------------
echo [4/5] Mise a jour des dependances JavaScript...
pushd "%FRONTEND%"
call npm install
if errorlevel 1 (
    echo   [X] npm install a echoue.
    popd
    pause
    exit /b 1
)
echo   [OK] Dependances JavaScript a jour
popd
echo.

REM ---------------------------------------------------------------
REM 5. Base de donnees et caches
REM
REM "migrate" applique uniquement les nouveautes de structure et ne
REM touche pas aux donnees existantes.
REM ---------------------------------------------------------------
echo [5/5] Mise a jour de la base de donnees...
pushd "%BACKEND%"
call php artisan migrate --force
if errorlevel 1 (
    echo.
    echo   [X] La migration a echoue. Verifiez que MySQL tourne.
    popd
    pause
    exit /b 1
)
call php artisan config:clear >nul 2>&1
call php artisan cache:clear >nul 2>&1
call php artisan view:clear >nul 2>&1
echo   [OK] Base de donnees et caches a jour
popd
echo.

echo =====================================================
echo    Mise a jour terminee
echo =====================================================
echo.
echo   Relancez l'application avec :  start-app.bat
echo.
pause
exit /b 0
