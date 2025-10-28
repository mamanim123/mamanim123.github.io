@echo off
chcp 65001 >nul
echo.
echo 🚀 청담재활 블로그 시스템 완전 자동 설치!
echo ==========================================
echo 💡 Git/Node.js가 없어도 자동으로 설치됩니다
echo.

REM 관리자 권한 확인
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ 관리자 권한이 필요합니다
    echo 💡 이 파일을 마우스 우클릭 → "관리자 권한으로 실행"
    pause
    exit /b 1
)

REM Node.js 설치 확인
echo 🔍 Node.js 확인 중...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다
    echo 📥 Node.js 자동 설치를 시작합니다...
    
    REM Chocolatey가 있으면 사용, 없으면 수동 다운로드 안내
    choco --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo 🍫 Chocolatey로 Node.js 설치 중...
        choco install nodejs -y
    ) else (
        echo 💡 Node.js 수동 설치가 필요합니다
        echo 1. https://nodejs.org 사이트가 자동으로 열립니다
        echo 2. LTS 버전을 다운로드하여 설치해주세요
        echo 3. 설치 완료 후 이 파일을 다시 실행해주세요
        start https://nodejs.org
        pause
        exit /b 1
    )
) else (
    echo ✅ Node.js 설치 확인됨
    node --version
)

REM Git 설치 확인
echo.
echo 🔍 Git 확인 중...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git이 설치되어 있지 않습니다
    echo 📥 Git 자동 설치를 시작합니다...
    
    REM Chocolatey가 있으면 사용, 없으면 수동 다운로드 안내
    choco --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo 🍫 Chocolatey로 Git 설치 중...
        choco install git -y
    ) else (
        echo 💡 Git 수동 설치가 필요합니다
        echo 1. https://git-scm.com 사이트가 자동으로 열립니다
        echo 2. Windows용 Git을 다운로드하여 설치해주세요
        echo 3. 설치 완료 후 컴퓨터를 재시작해주세요
        echo 4. 재시작 후 이 파일을 다시 실행해주세요
        start https://git-scm.com
        pause
        exit /b 1
    )
) else (
    echo ✅ Git 설치 확인됨
    git --version
)

echo.
echo 🎯 모든 요구사항이 충족되었습니다!
echo 📥 청담재활 프로젝트를 다운로드합니다...

REM 기존 폴더 확인
if exist "chungdam" (
    echo 📂 기존 chungdam 폴더 발견
    cd chungdam
    git pull origin main
) else (
    git clone https://github.com/mamanim123/chungdam.git
    cd chungdam
)

echo.
echo 📦 필요한 패키지 설치 중...
npm install

echo.
echo 🎯 첫 번째 업데이트 실행 중...
node update-blog-efficient.js

echo.
echo 🎉 모든 설치 및 설정 완료!
echo ========================================
echo 💡 앞으로는 다음 파일들을 사용하세요:
echo    📄 빠른 업데이트: scripts\update-blog-quick.bat
echo    🔄 완전 자동화: scripts\sync-and-update.bat
echo.
echo 📁 현재 위치: %CD%
echo 🌐 브라우저에서 index.html을 열어 결과를 확인하세요
echo.

echo 💻 아무 키나 누르면 종료됩니다...
pause >nul