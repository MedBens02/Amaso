@echo off
echo Starting basic check...

echo Testing Node.js...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo Node.js failed
) else (
    echo Node.js OK
)

echo Testing NPM...
npm --version
if %ERRORLEVEL% NEQ 0 (
    echo NPM failed
) else (
    echo NPM OK
)

echo Done.
pause