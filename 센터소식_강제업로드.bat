@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
echo.
echo 🚀 청담재활 센터소식 업데이트 + 강제 업로드!
echo ===============================================
echo.

REM 올바른 폴더로 이동
cd /d "%~dp0"

REM 현재 위치 확인
echo 📁 현재 위치: %CD%
echo.

REM 1단계: 센터소식 업데이트
echo 🎯 1단계: 센터소식 업데이트 실행 중...
node update-blog-efficient.js

if %errorlevel% neq 0 (
    echo ❌ 센터소식 업데이트 실패!
    echo 💡 인터넷 연결을 확인해주세요
    pause
    exit /b 1
)
echo ✅ 센터소식 업데이트 완료!
echo.

REM 2단계: GitHub 원격 저장소 확인/변경
echo 🔧 2단계: GitHub 저장소 설정 확인 중...
git remote get-url origin > temp_url.txt 2>nul
if exist temp_url.txt (
    for /f "delims=" %%i in (temp_url.txt) do set current_url=%%i
    del temp_url.txt
    echo 현재 저장소: !current_url!
    
    REM mamanim123.github.io가 아니면 변경
    echo !current_url! | findstr "mamanim123.github.io" >nul
    if !errorlevel! neq 0 (
        echo 🔄 저장소를 mamanim123.github.io로 변경 중...
        git remote set-url origin https://github.com/mamanim123/mamanim123.github.io.git
        echo ✅ 저장소 변경 완료!
    ) else (
        echo ✅ 이미 올바른 저장소로 설정됨!
    )
) else (
    echo 🔄 저장소 설정 중...
    git remote add origin https://github.com/mamanim123/mamanim123.github.io.git
)
echo.

REM 3단계: 필요한 파일만 선별해서 추가
echo 📋 3단계: 웹사이트 필수 파일만 선별 중...

REM 이전에 추가된 모든 파일 초기화
git reset >nul 2>&1
echo 🔄 Git staging area 초기화 완료

REM index.html 무조건 추가 (센터소식 업데이트로 항상 수정됨)
if exist "index.html" (
    git add index.html
    echo ✅ index.html 추가됨 - 센터소식 업데이트 반영
) else (
    echo ❌ index.html을 찾을 수 없습니다!
    pause
    exit /b 1
)

REM 새로운 블로그 이미지들만 추가 (Git untracked 파일만)
echo 🖼️ 새로운 블로그 이미지 확인 중...
set image_count=0

REM Git에서 untracked 상태인 *-청담재활.png 파일만 선별
for /f "tokens=2*" %%a in ('git status --porcelain 2^>nul ^| findstr "^?? images.*-청담재활.png"') do (
    if exist "%%a" (
        git add "%%a"
        echo ✅ %%a 추가됨 (새 파일)
        set /a image_count+=1
    )
)

if !image_count! equ 0 (
    echo ℹ️ 새로운 블로그 이미지가 없습니다
) else (
    echo 📊 총 !image_count!개의 새 이미지 발견!
)
echo.

REM 4단계: 변경사항 확인
echo 📊 4단계: 업로드할 파일 확인...
git status --short
echo.

REM 변경사항이 있는지 확인
git diff --cached --quiet
if %errorlevel% equ 0 (
    echo ℹ️ 업로드할 변경사항이 없습니다
    echo 💡 새로운 센터소식이 없거나 이미 최신 상태입니다
    pause
    exit /b 0
)

REM 5단계: 강제 커밋 및 푸시
echo 🚀 5단계: 강제 업로드 실행 중...

REM 현재 날짜와 시간 생성
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%"

git commit -m "센터소식 강제 업데이트 - %timestamp%"
if %errorlevel% neq 0 (
    echo ❌ 커밋 실패!
    pause
    exit /b 1
)

echo 💪 강제 푸시로 깔끔하게 업로드 중...
git push origin main --force
if %errorlevel% neq 0 (
    echo ❌ 강제 푸시 실패!
    echo 💡 GitHub 로그인 상태를 확인해주세요
    pause
    exit /b 1
)

echo ✅ 강제 업로드 완료!
echo.

REM 완료 메시지
echo 🎉 모든 작업 완료!
echo ===============================================
echo 📋 강제 업로드된 파일:
echo    ✅ index.html (센터소식 업데이트)

REM 업로드된 이미지 목록 출력
for /f "tokens=2*" %%a in ('git log -1 --name-only --pretty^=format: 2^>nul ^| findstr "images.*-청담재활.png"') do (
    echo    ✅ %%a
)
echo.
echo 💪 강제 푸시 사용:
echo    - GitHub의 불필요한 파일들 제거됨
echo    - 웹사이트 필수 파일만 깔끔하게 유지
echo    - 충돌 없이 즉시 업로드 완료
echo.
echo 🌐 결과 확인:
echo    - 웹사이트: https://mamanim123.github.io
echo    - GitHub: https://github.com/mamanim123/mamanim123.github.io
echo    - 업데이트 시간: %timestamp%
echo.

echo 💻 아무 키나 누르면 종료됩니다...
pause >nul