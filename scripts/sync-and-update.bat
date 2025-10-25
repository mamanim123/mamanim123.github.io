@echo off
chcp 65001 >nul
echo.
echo 🔄 동기화 + 업데이트 + 업로드 완전 자동화!
echo =============================================
echo.

REM 현재 위치 및 파일 확인
if not exist "update-blog-efficient.js" (
    echo ❌ update-blog-efficient.js 파일을 찾을 수 없습니다!
    echo 💡 chungdam 폴더 안에서 실행해주세요
    echo 📁 현재 위치: %CD%
    echo.
    pause
    exit /b 1
)

REM Git 저장소 확인
if not exist ".git" (
    echo ❌ Git 저장소가 아닙니다!
    echo 💡 setup-first-time.bat를 먼저 실행해주세요
    pause
    exit /b 1
)

REM 1단계: 최신 변경사항 다운로드
echo 📥 1단계: GitHub에서 최신 변경사항 다운로드 중...
git status >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git 상태 확인 실패!
    pause
    exit /b 1
)

git pull origin main
if %errorlevel% neq 0 (
    echo ❌ Git pull 실패!
    echo 💡 인터넷 연결과 GitHub 권한을 확인해주세요
    pause
    exit /b 1
)
echo ✅ 최신 상태로 동기화 완료
echo.

REM 2단계: 블로그 업데이트 실행
echo 🎯 2단계: 스마트 블로그 업데이트 실행 중...
echo 💡 새로운 글이 감지된 경우에만 블로그 ID 기반 이미지를 생성합니다
echo.
node update-blog-efficient.js

if %errorlevel% neq 0 (
    echo ❌ 블로그 업데이트 실패!
    echo 💡 GitHub 업로드를 취소합니다
    pause
    exit /b 1
)
echo ✅ 블로그 업데이트 완료
echo.

REM 3단계: 변경사항 확인
echo 📊 3단계: 변경사항 확인 중...
git status --porcelain >nul 2>&1
for /f %%i in ('git status --porcelain 2^>nul ^| find /c /v ""') do set changes=%%i

if %changes% equ 0 (
    echo ℹ️ 변경된 파일이 없습니다
    echo 💡 새로운 블로그 글이 없거나 이미 최신 상태입니다
    echo.
    echo 🎉 작업 완료!
    pause
    exit /b 0
)

echo 📋 변경된 파일 목록:
git status --short
echo.

REM 4단계: GitHub에 업로드
echo 📤 4단계: GitHub에 변경사항 업로드 중...

REM 현재 날짜와 시간 생성
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%-%MM%-%DD% %HH%:%Min%"

git add .
if %errorlevel% neq 0 (
    echo ❌ git add 실패!
    pause
    exit /b 1
)

git commit -m "센터소식 자동 업데이트 - %timestamp%"
if %errorlevel% neq 0 (
    echo ❌ git commit 실패!
    pause
    exit /b 1
)

git push origin main
if %errorlevel% neq 0 (
    echo ❌ git push 실패!
    echo 💡 GitHub 로그인 상태와 권한을 확인해주세요
    pause
    exit /b 1
)

echo ✅ GitHub 업로드 완료
echo.

REM 완료 메시지
echo 🎉 모든 작업 완료!
echo =============================================
echo 📋 실행된 작업:
echo    1. ✅ GitHub에서 최신 변경사항 다운로드
echo    2. ✅ 스마트 블로그 업데이트 실행
echo    3. ✅ 변경사항 GitHub에 업로드
echo.
echo 🌐 결과 확인:
echo    - GitHub: https://github.com/mamanim123/chungdam
echo    - 로컬: index.html 파일을 브라우저에서 열기
echo.
echo 📊 처리 결과:
for /f %%i in ('dir /b images\223*.png 2^>nul ^| find /c /v ""') do set count=%%i
if defined count (
    echo    - 현재 블로그 이미지 파일: %count%개 (블로그 ID 기반)
)
echo    - 업데이트 시간: %timestamp%
echo.

echo 💻 아무 키나 누르면 종료됩니다...
pause >nul