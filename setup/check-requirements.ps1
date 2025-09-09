Write-Host ""
Write-Host "=============================================" -ForegroundColor Blue
Write-Host "    Amaso App - Requirements Checker" -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue
Write-Host ""

$allGood = $true

Write-Host "Checking required software..." -ForegroundColor Yellow
Write-Host ""

# Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Command failed"
    }
} catch {
    Write-Host "❌ Node.js is NOT installed" -ForegroundColor Red
    Write-Host "    Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    $allGood = $false
}

# Check NPM
Write-Host "[2/5] Checking NPM..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ NPM is installed: v$npmVersion" -ForegroundColor Green
    } else {
        throw "Command failed"
    }
} catch {
    Write-Host "❌ NPM is NOT installed" -ForegroundColor Red
    $allGood = $false
}

# Check PHP
Write-Host "[3/5] Checking PHP..." -ForegroundColor Cyan
try {
    $phpOutput = php --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        $phpVersion = ($phpOutput -split "`n")[0]
        Write-Host "✅ PHP is installed: $phpVersion" -ForegroundColor Green
    } else {
        throw "Command failed"
    }
} catch {
    Write-Host "❌ PHP is NOT installed" -ForegroundColor Red
    Write-Host "    Please install PHP 8.2+ or XAMPP from https://www.apachefriends.org/" -ForegroundColor Yellow
    $allGood = $false
}

# Check Composer
Write-Host "[4/5] Checking Composer..." -ForegroundColor Cyan
try {
    $composerOutput = composer --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Composer is installed: $composerOutput" -ForegroundColor Green
    } else {
        throw "Command failed"
    }
} catch {
    Write-Host "❌ Composer is NOT installed" -ForegroundColor Red
    Write-Host "    Please install Composer from https://getcomposer.org/download/" -ForegroundColor Yellow
    $allGood = $false
}

# Check MySQL
Write-Host "[5/5] Checking MySQL..." -ForegroundColor Cyan
try {
    $mysqlOutput = mysql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ MySQL command line is available" -ForegroundColor Green
    } else {
        throw "Command failed"
    }
} catch {
    Write-Host "❌ MySQL command line is NOT available" -ForegroundColor Red
    Write-Host "    Please install MySQL or XAMPP, or make sure MySQL is in your PATH" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Blue

if ($allGood) {
    Write-Host "🎉 All requirements are installed!" -ForegroundColor Green
    Write-Host "You can now run setup.bat to configure the application." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some requirements are missing." -ForegroundColor Yellow
    Write-Host "Please install the missing software and run this check again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "For detailed installation instructions, see:" -ForegroundColor Yellow
    Write-Host "WINDOWS_INSTALLATION_GUIDE.md" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")