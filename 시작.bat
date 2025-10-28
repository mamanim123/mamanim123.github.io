@echo off
chcp 65001 >nul
echo.
echo 🚀 청담재활 블로그 시스템 원클릭 시작!
echo ========================================
echo.

REM 현재 chungdam 폴더가 있는지 확인
if exist "chungdam" (
    echo 📂 기존 chungdam 폴더 발견!
    cd chungdam
    echo 🔄 최신 상태로 업데이트 중...
    git pull origin main
    echo 🎯 바로 업데이트 실행합니다...
    scripts\update-blog-quick.bat
) else (
    echo 📥 GitHub에서 프로젝트 다운로드 중...
    git clone https://github.com/mamanim123/chungdam.git
    if %errorlevel% neq 0 (
        echo ❌ 다운로드 실패! 인터넷 연결을 확인해주세요
        pause
        exit /b 1
    )
    cd chungdam
    echo 🎯 첫 설정을 시작합니다...
    scripts\setup-first-time.bat
)

echo.
echo 💻 아무 키나 누르면 종료됩니다...
pause >nul