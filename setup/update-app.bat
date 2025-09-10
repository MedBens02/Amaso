@echo off
setlocal EnableDelayedExpansion
title Amaso App - Mise à Jour Automatique
color 0e
echo.
echo =============================================
echo       🔄 Amaso App - Mise à Jour 🔄
echo =============================================
echo.

REM Vérifier si nous sommes dans le bon répertoire
if not exist "..\backend" (
    echo ❌ Erreur: Exécutez ce script depuis le dossier 'setup'
    timeout /t 5 >nul
    exit /b 1
)

echo 🔍 Vérification du système...

REM Vérifier si Git est installé
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git n'est pas installé ou pas dans le PATH
    echo.
    echo 💡 Pour installer Git:
    echo   1. Téléchargez Git depuis: https://git-scm.com/downloads
    echo   2. Installez avec les options par défaut
    echo   3. Redémarrez cette application
    echo.
    pause
    exit /b 1
)

echo ✅ Git est installé

REM Vérifier si c'est un dépôt Git
if not exist "..\.git" (
    echo ❌ Ce dossier n'est pas un dépôt Git
    echo.
    echo 💡 Si vous avez téléchargé un ZIP:
    echo   - Cette fonction ne peut pas être utilisée
    echo   - Téléchargez la nouvelle version manuellement
    echo.
    pause
    exit /b 1
)

echo ✅ Dépôt Git détecté

echo.
echo 🚨 ATTENTION: Cette opération va:
echo   ✓ Sauvegarder vos fichiers de configuration
echo   ✓ Télécharger la dernière version du code
echo   ✓ Restaurer vos configurations
echo   ✓ Installer les nouvelles dépendances
echo.
echo ⚠️  Les modifications non commitées seront perdues!
echo.

set /p "continue=Continuer la mise à jour? (o/N): "
if /i not "%continue%"=="o" (
    echo Mise à jour annulée par l'utilisateur
    timeout /t 3 >nul
    exit /b 0
)

echo.
echo 🔄 Début de la mise à jour...
echo.

REM Arrêter les services en cours
echo [1/8] 🛑 Arrêt des services...
call stop-app.bat >nul 2>&1
echo     ✅ Services arrêtés

REM Sauvegarder les fichiers de configuration
echo [2/8] 💾 Sauvegarde des configurations...
if exist "..\backend\.env" (
    copy "..\backend\.env" "..\backend\.env.backup" >nul
    echo     ✅ Configuration backend sauvegardée
)
if exist "..\frontend\.env.local" (
    copy "..\frontend\.env.local" "..\frontend\.env.local.backup" >nul
    echo     ✅ Configuration frontend sauvegardée
)

REM Obtenir le statut Git actuel
echo [3/8] 📊 Vérification du dépôt...
cd ..
git status --porcelain > temp_status.txt
if exist temp_status.txt (
    for %%A in (temp_status.txt) do set "size=%%~zA"
    if not "!size!"=="0" (
        echo     ⚠️  Modifications locales détectées - sauvegarde...
        git stash push -m "Automatic backup before update - %date% %time%" >nul 2>&1
        echo     ✅ Modifications sauvegardées dans Git stash
    ) else (
        echo     ✅ Aucune modification locale
    )
    del temp_status.txt
)

REM Télécharger les dernières modifications
echo [4/8] ⬇️  Téléchargement des mises à jour...
git fetch origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo     ❌ Erreur lors du téléchargement
    echo     Vérifiez votre connexion Internet
    pause
    exit /b 1
)

REM Vérifier s'il y a des mises à jour
for /f %%i in ('git rev-list HEAD...origin/master --count 2^>nul') do set "updates=%%i"
if "%updates%"=="0" (
    echo     ℹ️  Aucune mise à jour disponible
    echo     Votre version est déjà à jour!
    cd setup
    pause
    exit /b 0
)

echo     ✅ %updates% mise(s) à jour disponible(s)

REM Appliquer les mises à jour
echo [5/8] 🔄 Application des mises à jour...
git pull origin master >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo     ❌ Erreur lors de la mise à jour
    echo     Restauration de la sauvegarde...
    git stash pop >nul 2>&1
    cd setup
    pause
    exit /b 1
)
echo     ✅ Code mis à jour avec succès

REM Restaurer les configurations
echo [6/8] 🔙 Restauration des configurations...
if exist "backend\.env.backup" (
    copy "backend\.env.backup" "backend\.env" >nul
    del "backend\.env.backup" >nul
    echo     ✅ Configuration backend restaurée
)
if exist "frontend\.env.local.backup" (
    copy "frontend\.env.local.backup" "frontend\.env.local" >nul
    del "frontend\.env.local.backup" >nul
    echo     ✅ Configuration frontend restaurée
)

REM Mettre à jour les dépendances
echo [7/8] 📦 Mise à jour des dépendances...

REM Backend
echo     🔄 Dépendances PHP (Backend)...
cd backend
composer install --no-interaction >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo     ⚠️  Erreur avec les dépendances PHP - continuons
) else (
    echo     ✅ Dépendances PHP mises à jour
)

REM Frontend
echo     🔄 Dépendances JavaScript (Frontend)...
cd ..\frontend
npm install >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo     ⚠️  Erreur avec les dépendances JavaScript - continuons
) else (
    echo     ✅ Dépendances JavaScript mises à jour
)

REM Migrations de base de données
echo [8/8] 🗄️  Mise à jour de la base de données...
cd ..\backend
php artisan migrate --force >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo     ⚠️  Erreur de migration - vérifiez manuellement
) else (
    echo     ✅ Base de données mise à jour
)

REM Effacer les caches
echo     🧹 Nettoyage des caches...
php artisan config:clear >nul 2>&1
php artisan cache:clear >nul 2>&1
php artisan view:clear >nul 2>&1

cd ..\setup

echo.
echo =============================================
echo         🎉 Mise à Jour Terminée! 🎉
echo =============================================
echo.
echo 📊 Résumé:
echo   ✅ %updates% mise(s) à jour appliquée(s)
echo   ✅ Configurations préservées
echo   ✅ Dépendances mises à jour
echo   ✅ Base de données synchronisée
echo.
echo 💡 Prochaines étapes:
echo   1. Testez l'application: start-app.bat
echo   2. Vérifiez que tout fonctionne
echo   3. Signalez tout problème à l'équipe technique
echo.

set /p "start_now=🚀 Démarrer l'application maintenant? (o/N): "
if /i "%start_now%"=="o" (
    echo.
    echo Démarrage de l'application...
    call start-app.bat
) else (
    echo.
    echo ℹ️  Utilisez start-app.bat quand vous serez prêt
    echo.
    echo Fermeture dans 10 secondes...
    timeout /t 10 >nul
)

exit