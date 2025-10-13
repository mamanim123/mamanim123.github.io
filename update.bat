@echo off
chcp 65001 > nul

echo ========================================
echo   청담재활 블로그 자동 업데이트
echo ========================================
echo.

echo 🧹 기존 설치 파일 정리 중...
if exist "node_modules" (
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    del package-lock.json
)

echo.
echo 📦 의존성 패키지 설치 중...
echo    - axios (HTTP 요청)
echo    - cheerio (HTML 파싱)
echo    - xml2js (RSS 파싱)
echo.
call npm install

if errorlevel 1 (
    echo.
    echo ❌ npm install 실패!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   블로그 업데이트 스크립트 실행
echo ========================================
echo.
echo 📡 네이버 블로그 RSS 피드 읽기...
echo 📸 대표 이미지 추출 및 다운로드...
echo 📝 index.html 파일 업데이트...
echo.

node update-blog-images-final.js

if errorlevel 1 (
    echo.
    echo ❌ 블로그 업데이트 실패!
    echo    로그를 확인하세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   작업 완료!
echo ========================================
echo.
echo ✅ 블로그 센터소식이 업데이트되었습니다.
echo.
echo 📂 업데이트된 파일:
echo    - index.html
echo    - images/청담재활-*.png
echo.

REM === Git 저장소 확인 ===
if not exist ".git" (
    echo ⚠️  Git 저장소가 아닙니다. Git 푸시를 건너뜁니다.
    echo 🌐 브라우저에서 index.html을 열어 확인하세요.
    pause
    exit /b 0
)

echo.
echo ========================================
echo   Git 상태 확인
echo ========================================
echo.
git status

echo.
echo ========================================
echo   GitHub 푸시 확인
echo ========================================
echo.
echo 위 변경사항을 GitHub에 푸시하시겠습니까?
echo.
pause

echo.
echo 📂 변경된 파일 추가 중...
git add .

echo.
echo 💾 커밋 생성 중...
set commit_msg=블로그 자동 업데이트: %date% %time%
git commit -m "%commit_msg%"

if errorlevel 1 (
    echo.
    echo ⚠️  커밋할 변경사항이 없거나 커밋 실패
    pause
    exit /b 0
)

echo.
echo 🚀 GitHub에 푸시 중...
git push

if errorlevel 1 (
    echo.
    echo ❌ Git push 실패!
    echo    원격 저장소 연결 상태를 확인하세요.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   모든 작업 완료!
echo ========================================
echo.
echo ✅ 블로그 업데이트 완료
echo ✅ GitHub 푸시 완료
echo.
echo 🌐 GitHub Pages에서 변경사항이 반영될 때까지 1-2분 소요됩니다.
echo.

pause
