@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ========================================
echo   Manual Test of Update Script
echo ========================================
echo.
echo Current directory: %cd%
echo.

REM Check if we're in the correct directory
if not exist "update-blog-images-final.js" (
    echo [ERROR] update-blog-images-final.js not found!
    pause
    exit /b 1
)
echo [OK] update-blog-images-final.js found
echo.

echo [TEST 1] Testing cleanup...
if exist "node_modules" (
    echo   - node_modules exists, will be removed
) else (
    echo   - node_modules does not exist
)

if exist "package-lock.json" (
    echo   - package-lock.json exists, will be removed
) else (
    echo   - package-lock.json does not exist
)
echo.

echo [TEST 2] Testing npm install (dry-run)...
npm install --dry-run
if errorlevel 1 (
    echo [ERROR] npm install would fail
    pause
    exit /b 1
)
echo [OK] npm install would succeed
echo.

echo [TEST 3] Testing node script existence...
if exist "update-blog-images-final.js" (
    echo [OK] Script file exists
    node --check update-blog-images-final.js
    if errorlevel 1 (
        echo [ERROR] Script has syntax errors
        pause
        exit /b 1
    )
    echo [OK] Script syntax is valid
) else (
    echo [ERROR] Script file not found
    pause
    exit /b 1
)
echo.

echo [TEST 4] Testing git commands...
git status >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not available or not a git repository
    pause
    exit /b 1
)
echo [OK] Git is available
echo.

echo ========================================
echo   All tests passed!
echo   You can now run update.bat safely
echo ========================================
pause
