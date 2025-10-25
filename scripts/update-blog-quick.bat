@echo off
chcp 65001 >nul
echo.
echo 🎯 청담재활 센터소식 빠른 업데이트!
echo ====================================
echo.

REM 현재 위치 및 파일 확인
if not exist "update-blog-efficient.js" (
    echo ❌ update-blog-efficient.js 파일을 찾을 수 없습니다!
    echo 💡 chungdam 폴더 안에서 실행해주세요
    echo 📁 현재 위치: %CD%
    echo.
    echo 🔧 해결 방법:
    echo    1. chungdam 폴더로 이동
    echo    2. 또는 setup-first-time.bat 먼저 실행
    echo.
    pause
    exit /b 1
)

REM Node.js 확인
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js를 찾을 수 없습니다!
    echo 💡 Node.js가 설치되어 있는지 확인해주세요
    pause
    exit /b 1
)

REM node_modules 확인
if not exist "node_modules" (
    echo ⚠️ node_modules가 없습니다. 패키지를 설치합니다...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 패키지 설치 실패!
        pause
        exit /b 1
    )
    echo ✅ 패키지 설치 완료
    echo.
)

REM 업데이트 실행
echo 🚀 스마트 블로그 업데이트 실행 중...
echo 💡 새로운 글이 있는 경우에만 블로그 ID 기반 이미지를 생성합니다
echo.
node update-blog-efficient.js

if %errorlevel% equ 0 (
    echo.
    echo 🎉 업데이트 완료!
    echo ====================================
    echo 📋 다음 단계:
    echo    🌐 index.html을 브라우저에서 확인
    echo    📤 변경사항 업로드: sync-and-update.bat 실행
    echo    📁 생성된 이미지: images\*.png (블로그 ID 기반)
    echo.
    
    REM 생성된 블로그 이미지 파일 개수 표시
    for /f %%i in ('dir /b images\223*.png 2^>nul ^| find /c /v ""') do set count=%%i
    if defined count (
        echo 📊 현재 블로그 이미지 파일 개수: %count%개
    )
    echo.
) else (
    echo.
    echo ❌ 업데이트 실패!
    echo ====================================
    echo 🔧 가능한 원인:
    echo    - 인터넷 연결 문제
    echo    - RSS 피드 접근 불가
    echo    - 파일 권한 문제
    echo.
    echo 💡 문제 해결:
    echo    1. 인터넷 연결 확인
    echo    2. 방화벽 설정 확인
    echo    3. setup-first-time.bat 다시 실행
    echo.
)

echo 💻 아무 키나 누르면 종료됩니다...
pause >nul