@echo off
chcp 65001 >nul
echo.
echo 🚀 청담재활 블로그 시스템 첫 설정 시작!
echo ============================================
echo.

REM 현재 위치 확인
echo 📍 현재 위치: %CD%
echo.

REM Node.js 설치 확인
echo 🔍 Node.js 버전 확인 중...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js가 설치되어 있지 않습니다!
    echo 💡 https://nodejs.org 에서 Node.js를 설치해주세요
    echo.
    pause
    exit /b 1
)
node --version
echo ✅ Node.js 설치 확인됨
echo.

REM Git 설치 확인
echo 🔍 Git 설치 확인 중...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git이 설치되어 있지 않습니다!
    echo 💡 https://git-scm.com 에서 Git을 설치해주세요
    echo.
    pause
    exit /b 1
)
git --version
echo ✅ Git 설치 확인됨
echo.

REM 저장소 클론 여부 확인
if exist "chungdam" (
    echo 📂 기존 chungdam 폴더가 있습니다
    echo 🔄 기존 폴더로 이동합니다...
    cd chungdam
) else (
    echo 📥 GitHub에서 저장소 클론 중...
    git clone https://github.com/mamanim123/chungdam.git
    if %errorlevel% neq 0 (
        echo ❌ 저장소 클론 실패!
        echo 💡 인터넷 연결과 GitHub 접근 권한을 확인해주세요
        pause
        exit /b 1
    )
    echo ✅ 저장소 클론 완료
    cd chungdam
)
echo.

REM 패키지 설치
echo 📦 필요한 패키지 설치 중...
echo 💡 axios와 cheerio만 설치됩니다 (브라우저 종속성 없음)
npm install
if %errorlevel% neq 0 (
    echo ❌ 패키지 설치 실패!
    echo 💡 네트워크 연결을 확인하고 다시 시도해주세요
    pause
    exit /b 1
)
echo ✅ 패키지 설치 완료
echo.

REM 첫 번째 업데이트 실행
echo 🎯 첫 번째 블로그 업데이트 실행 중...
echo 💡 블로그 ID 기반 파일명으로 이미지를 생성합니다
node update-blog-efficient.js
if %errorlevel% equ 0 (
    echo.
    echo 🎉 모든 설정 완료!
    echo ============================================
    echo 💡 다음 사용법:
    echo    📄 빠른 업데이트: update-blog-quick.bat
    echo    🔄 동기화+업데이트: sync-and-update.bat
    echo    📁 위치: %CD%
    echo.
) else (
    echo ❌ 첫 업데이트 실패. 설정을 확인해주세요
)

echo 💻 아무 키나 누르면 종료됩니다...
pause >nul