@echo off
chcp 65001 > nul

REM --- 네트워크 드라이브 문제 우회: 로컬에 복사 후 작업 ---
set LOCAL_WORK=C:\temp\chungdam-work
set NETWORK_PATH=%~dp0

echo 📁 Creating local working directory...
if not exist "%LOCAL_WORK%" mkdir "%LOCAL_WORK%"

echo 📋 Copying files to local drive...
xcopy "%NETWORK_PATH%*" "%LOCAL_WORK%\" /E /I /Y /Q

echo 🔄 Changing to local directory...
cd /d "%LOCAL_WORK%"

echo 🧹 Cleaning up previous installation...
if exist "node_modules" (
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    del package-lock.json
)

echo 📦 Installing dependencies...
npm install

echo.
echo ⚡ Running Blog Update Script...
echo 📡 RSS 피드에서 최신 블로그 3개 가져오기
echo 📸 각 블로그 대표 이미지 추출
echo 📝 index.html 센터소식 섹션 자동 업데이트
echo.
node update-blog-images-final.js
if errorlevel 1 (
    echo.
    echo ❌ 스크립트 실행 실패!
    pause
    exit /b 1
)

echo.
echo 📤 Copying results back to network drive...
xcopy "%LOCAL_WORK%\*" "%NETWORK_PATH%" /E /I /Y /Q /EXCLUDE:%NETWORK_PATH%exclude.txt

echo 🗑️ Cleaning up local directory...
cd /d C:\
rmdir /s /q "%LOCAL_WORK%"

echo ✅ All tasks completed.
pause
