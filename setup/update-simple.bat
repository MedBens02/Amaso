@echo off
title Amaso - Mise à Jour Rapide
color 0b
echo.
echo =============================================
echo     🔄 Amaso - Mise à Jour Rapide 🔄
echo =============================================
echo.

REM Vérifications de base
if not exist "..\.git" (
    echo ❌ Ce n'est pas un dépôt Git
    echo 💡 Téléchargez manuellement la nouvelle version
    pause
    exit /b 1
)

git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git non installé - Téléchargez depuis: https://git-scm.com
    pause
    exit /b 1
)

echo 🔄 Mise à jour en cours...
echo.

REM Arrêter les services
call stop-app.bat >nul 2>&1
echo ✅ Services arrêtés

REM Sauvegarder et mettre à jour
cd ..
if exist "backend\.env" copy "backend\.env" "backend\.env.bak" >nul
if exist "frontend\.env.local" copy "frontend\.env.local" "frontend\.env.local.bak" >nul
echo ✅ Configurations sauvegardées

git stash >nul 2>&1
git pull origin master >nul 2>&1
echo ✅ Code mis à jour

if exist "backend\.env.bak" (
    copy "backend\.env.bak" "backend\.env" >nul
    del "backend\.env.bak" >nul
)
if exist "frontend\.env.local.bak" (
    copy "frontend\.env.local.bak" "frontend\.env.local" >nul
    del "frontend\.env.local.bak" >nul
)
echo ✅ Configurations restaurées

cd setup
echo.
echo 🎉 Mise à jour terminée!
echo 🚀 Utilisez start-app.bat pour redémarrer
echo.
timeout /t 5 >nul
exit