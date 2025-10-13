@echo off
chcp 65001 > nul

echo Starting test...
echo Current directory: %cd%
echo.

echo Testing file existence...
if exist "update-blog-images-final.js" (
    echo [OK] update-blog-images-final.js found
) else (
    echo [ERROR] update-blog-images-final.js NOT found
)

if exist "package.json" (
    echo [OK] package.json found
) else (
    echo [ERROR] package.json NOT found
)
echo.

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo [ERROR] Node.js not found or not in PATH
) else (
    echo [OK] Node.js is available
)
echo.

echo Checking npm...
npm --version
if errorlevel 1 (
    echo [ERROR] npm not found or not in PATH
) else (
    echo [OK] npm is available
)
echo.

echo Checking Git...
git --version
if errorlevel 1 (
    echo [ERROR] Git not found or not in PATH
) else (
    echo [OK] Git is available
)
echo.

echo Test completed.
pause
