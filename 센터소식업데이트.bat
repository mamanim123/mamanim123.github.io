@echo off
chcp 65001 >nul
echo.
echo 🎯 청담재활 센터소식 업데이트!
echo ============================
echo.

REM 올바른 폴더로 이동
cd /d "%~dp0"

REM 현재 위치 확인
echo 📁 현재 위치: %CD%
echo.

REM Node.js 실행
echo 🚀 센터소식 업데이트 실행 중...
node update-blog-efficient.js

if %errorlevel% equ 0 (
    echo.
    echo ✅ 업데이트 완료!
    echo 🌐 index.html 파일을 브라우저에서 확인해보세요
) else (
    echo.
    echo ❌ 업데이트 실패!
    echo 💡 인터넷 연결을 확인해주세요
)

echo.
echo 💻 아무 키나 누르면 종료됩니다...
pause >nul