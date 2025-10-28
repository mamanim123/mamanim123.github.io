@echo off
chcp 65001 >nul
echo.
echo 🚀 청담재활 블로그 스마트 시작!
echo ===============================
echo.

REM Node.js 확인
echo 🔍 시스템 환경 확인 중...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다
    echo.
    echo 🛠️ 설치 방법:
    echo 1. https://nodejs.org 사이트 방문
    echo 2. LTS 버전 다운로드 및 설치
    echo 3. 컴퓨터 재시작
    echo 4. 이 파일 다시 실행
    echo.
    echo 💡 지금 Node.js 사이트를 열까요? (Y/N)
    set /p choice="선택: "
    if /i "%choice%"=="Y" start https://nodejs.org
    pause
    exit /b 1
)

REM Git 확인
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git이 설치되어 있지 않습니다
    echo.
    echo 🛠️ 설치 방법:
    echo 1. https://git-scm.com 사이트 방문
    echo 2. Windows용 Git 다운로드 및 설치
    echo 3. 컴퓨터 재시작
    echo 4. 이 파일 다시 실행
    echo.
    echo 💡 지금 Git 사이트를 열까요? (Y/N)
    set /p choice="선택: "
    if /i "%choice%"=="Y" start https://git-scm.com
    pause
    exit /b 1
)

echo ✅ Node.js 설치됨: 
node --version
echo ✅ Git 설치됨: 
git --version
echo.

REM 프로젝트 시작
echo 🎯 모든 준비 완료! 프로젝트를 시작합니다...

if exist "chungdam" (
    echo 📂 기존 chungdam 폴더 발견
    cd chungdam
    echo 🔄 최신 상태로 업데이트 중...
    git pull origin main
    echo 🎯 빠른 업데이트 실행...
    scripts\update-blog-quick.bat
) else (
    echo 📥 GitHub에서 프로젝트 다운로드 중...
    git clone https://github.com/mamanim123/chungdam.git
    cd chungdam
    echo 🎯 첫 설정 실행...
    scripts\setup-first-time.bat
)

echo 💻 작업 완료!