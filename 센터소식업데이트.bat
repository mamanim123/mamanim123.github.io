@echo off
chcp 65001 >nul
setlocal

echo.
echo 🎯 청담재활 센터소식 업데이트 + GitHub 강제 업로드!
echo ==================================================
echo.

cd /d "%~dp0"
echo 📁 현재 위치: %CD%
echo.

echo 🚀 센터소식 업데이트 및 GitHub 업로드를 시작합니다...
call "%~dp0센터소식업데이트_깃푸시.bat"
set "result=%errorlevel%"

if not "%result%"=="0" (
    echo.
    echo ❌ 전체 작업 실패! 종료 코드: %result%
    exit /b %result%
)

echo.
echo 🎉 센터소식 업데이트 작업이 완료되었습니다!
pause
exit /b 0
