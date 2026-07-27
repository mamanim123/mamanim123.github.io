@echo off
chcp 65001 >nul
setlocal EnableExtensions EnableDelayedExpansion

echo.
echo 🎯 청담재활 센터소식 업데이트 + GitHub 강제 업로드!
echo ==================================================
echo.

cd /d "%~dp0"
echo 📁 현재 위치: %CD%
echo.

REM 1단계: 센터소식 업데이트
echo 🚀 1단계: 센터소식 업데이트 실행 중...
node update-blog-efficient.js
if errorlevel 1 (
    echo ❌ 센터소식 업데이트 실패!
    exit /b 1
)
echo ✅ 센터소식 업데이트 완료!
echo.

REM 2단계: 원격 최신 이력을 기준으로 작업 기준점 정리
REM 원격에만 있는 22개 커밋을 삭제하지 않도록 먼저 origin/main을 기준으로 맞춥니다.
echo 📥 2단계: GitHub 최신 이력 확인 중...
git fetch origin main
if errorlevel 1 (
    echo ❌ GitHub 최신 이력 확인 실패!
    exit /b 1
)

git reset --mixed origin/main
if errorlevel 1 (
    echo ❌ Git 기준점 정리 실패!
    exit /b 1
)
echo ✅ 원격 최신 상태를 기준으로 준비 완료!
echo.

REM 3단계: 업로드 대상만 staging
REM thumbnails, node_modules, 백업 파일 등은 업로드하지 않습니다.
echo 📋 3단계: 업로드 대상 파일 staging 중...

git add -- index.html
if errorlevel 1 (
    echo ❌ index.html staging 실패!
    exit /b 1
)

REM 네이버 게시물 ID 기반 이미지 전체를 확인합니다.
REM 이미 원격에 있는 파일은 변경사항이 없으면 commit에 포함되지 않습니다.
for /f "delims=" %%f in ('dir /b "images\*-청담재활.png" 2^>nul') do (
    git add -- "images\%%f"
)

REM 이 자동화 파일의 수정 내용도 함께 배포합니다.
git add -- "센터소식업데이트.bat" "센터소식업데이트_깃푸시.bat"
if errorlevel 1 (
    echo ❌ 배치 파일 staging 실패!
    exit /b 1
)

echo.
echo 📊 실제 commit 예정 파일:
git status --short --untracked-files=no
echo.

git diff --cached --quiet
if not errorlevel 1 (
    echo ℹ️ 새로 commit할 변경사항이 없습니다.
    exit /b 0
)

REM 4단계: commit
echo 💾 4단계: 변경사항 commit 중...
git commit -m "센터소식 자동 업데이트"
if errorlevel 1 (
    echo ❌ commit 실패!
    exit /b 1
)

REM 5단계: 명시적으로 강제 push
REM fetch 직후 만든 commit만 올리므로 원격의 기존 파일은 유지됩니다.
echo 📤 5단계: GitHub에 강제 push 중...
git push origin main --force
if errorlevel 1 (
    echo ❌ 강제 push 실패!
    echo 💡 GitHub 인증과 네트워크 상태를 확인해주세요.
    exit /b 1
)

echo.
echo ✅ GitHub 업로드 완료!
echo 🌐 https://mamanim123.github.io
echo.
exit /b 0
