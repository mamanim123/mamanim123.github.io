@echo off
echo 🎯 청담재활 블로그 자동 업데이트 시작!
echo.

REM Node.js 버전 확인
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js가 설치되지 않았습니다.
    echo    https://nodejs.org에서 다운로드하세요.
    pause
    exit /b 1
)

REM 필요한 패키지 설치 확인
if not exist "node_modules" (
    echo 📦 필요한 패키지 설치 중...
    npm install
)

REM 블로그 업데이트 실행
echo 🚀 블로그 업데이트 실행 중...
node update-blog.js

echo.
echo ✅ 완료! 브라우저에서 index.html을 열어 확인하세요.
pause