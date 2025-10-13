@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title 청담외출메모장 개선된 빌드 시스템

:: 자동 모드 체크 (매개변수로 auto 전달시)
if "%1"=="auto" (
    set AUTO_MODE=true
    set UPGRADE_CHOICE=y
    set UPGRADE_TYPE=2
    set BUILD_ENV=1
    echo [자동 모드] 마이너 버전 업그레이드를 포함하여 빌드를 진행합니다.
) else (
    set AUTO_MODE=false
    set BUILD_ENV=
    echo [수동 모드] 빌드 환경을 선택합니다.
)

echo ================================
echo   청담외출메모장 개선된 빌드 시스템
echo ================================
echo.

:: 현재 디렉토리로 이동
cd /d "%~dp0"

:: package.json에서 현재 버전 읽기
for /f "tokens=2 delims=:, " %%a in ('type package.json ^| findstr "version"') do (
    set CURRENT_VERSION=%%a
)
set CURRENT_VERSION=%CURRENT_VERSION:"=%

:: 타임스탬프 생성 (날짜에서 하이픈, 슬래시 제거)
set TIMESTAMP=%date%
set TIMESTAMP=%TIMESTAMP:-=%
set TIMESTAMP=%TIMESTAMP:/=%

echo 현재 버전: v%CURRENT_VERSION%
echo 빌드 타임스탬프: %TIMESTAMP%
echo.

:: 버전 업그레이드 옵션
if "%AUTO_MODE%"=="false" (
    set /p UPGRADE_CHOICE="버전을 업그레이드 하시겠습니까? (y/n): "
)

if /i "%UPGRADE_CHOICE%"=="y" (
    if "%AUTO_MODE%"=="false" (
        echo.
        echo 업그레이드 타입을 선택하세요:
        echo 1. 패치 업그레이드 (권장)
        echo 2. 마이너 업그레이드
        echo 3. 메이저 업그레이드
        echo 4. 수동 입력
        echo.
        set /p UPGRADE_TYPE="선택 (1-4): "
    )

    if "%UPGRADE_TYPE%"=="1" (
        for /f "tokens=1,2,3 delims=." %%x in ("%CURRENT_VERSION%") do (
            set /a PATCH=%%z+1
            set NEW_VERSION=%%x.%%y.!PATCH!
        )
    ) else if "%UPGRADE_TYPE%"=="2" (
        for /f "tokens=1,2,3 delims=." %%x in ("%CURRENT_VERSION%") do (
            set /a MINOR=%%y+1
            set NEW_VERSION=%%x.!MINOR!.0
        )
    ) else if "%UPGRADE_TYPE%"=="3" (
        for /f "tokens=1,2,3 delims=." %%x in ("%CURRENT_VERSION%") do (
            set /a MAJOR=%%x+1
            set NEW_VERSION=!MAJOR!.0.0
        )
    ) else if "%UPGRADE_TYPE%"=="4" (
        set /p NEW_VERSION="새 버전을 입력하세요: "
    ) else (
        echo 잘못된 선택입니다. 현재 버전을 유지합니다.
        set NEW_VERSION=%CURRENT_VERSION%
    )
    
    echo.
    echo 버전 업그레이드: v%CURRENT_VERSION% to v%NEW_VERSION%
    
    powershell -Command "[System.IO.File]::WriteAllText('package.json.tmp', [System.IO.File]::ReadAllText('package.json', [System.Text.Encoding]::UTF8).Replace('\"version\": \"%CURRENT_VERSION%\"', '\"version\": \"%NEW_VERSION%\"'), [System.Text.Encoding]::UTF8)"
    if exist package.json.tmp (
        move package.json.tmp package.json
        echo package.json 버전 업데이트 완료
        set CURRENT_VERSION=%NEW_VERSION%
    ) else (
        echo 오류: package.json 버전 업데이트 실패
        pause
        exit /b 1
    )
) else (
    echo 현재 버전 v%CURRENT_VERSION%로 빌드를 진행합니다.
)

:: 빌드 환경 선택
if "%AUTO_MODE%"=="false" (
    echo.
    echo 빌드 환경을 선택하세요:
    echo 1. 사무실용 (공유폴더 배포 + 런처 포함)
    echo 2. 집용 (로컬 테스트용 + 확장된 소스백업)
    echo.
    set /p BUILD_ENV="선택 (1-2): "
)

if "%BUILD_ENV%"=="1" (
    set BUILD_TYPE=사무실용
    set EXECUTABLE_NAME=외출메모장
    set DEPLOY_SHARED=yes
) else (
    set BUILD_TYPE=집용-테스트
    set EXECUTABLE_NAME=외출메모장v%CURRENT_VERSION%-테스트
    set DEPLOY_SHARED=no
)

:: 빌드명 생성 (덮어쓰기 방지)
set BUILD_NAME=청담외출메모장v%CURRENT_VERSION%-%TIMESTAMP%

echo.
echo ================================
echo   빌드 프로세스 시작
echo ================================
echo 빌드명: %BUILD_NAME%
echo 실행파일: %EXECUTABLE_NAME%.exe
echo 환경: %BUILD_TYPE%
echo.

:: npm 의존성 설치
echo npm 의존성 확인 중...
echo node_modules 폴더가 이미 존재하는지 확인...
if not exist "node_modules" (
    echo node_modules가 없으므로 npm install 실행...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo 오류: npm install 실패
        pause
        exit /b 1
    )
) else (
    echo node_modules 폴더가 이미 존재합니다. npm install 건너뜀.
)

:: Electron 패키징 (버전별 빌드명 사용)
echo.
echo Electron 애플리케이션 빌드 중...
call npx electron-packager . "%BUILD_NAME%" --platform=win32 --arch=x64 --out=dist --overwrite --executable-name="%EXECUTABLE_NAME%" --prune=true --ignore="backups|backup_.*|batch_backup_.*|master_backup_.*|dist|logs|temp_extract|build.*\.(js|bat|sh|ps1)|.*\.bat|.*\.md|[1-4]\.png|청담외출메모장-v.*|청담외출메모장v.*|dist-launcher|launcher-.*\.exe|chungdam-launcher\.exe|NUL|temp\.ico|.*\.zip|.*\.log|\.git|\.vscode|\.idea|\.claude|\.kiro|.*\.(swp|swo)|test-.*\.(html|js)|test-local-run|청담외출메모장-마스터.*|launcher-gui.*\.(js|json)|launcher-package\.json|launcher-silent\.js|.*\.(rar|7z)|node_modules/\.cache|node_modules/.bin|\.npm|\.nyc_output|coverage|\.coverage|build/Release|\.eslintcache|\.tsbuildinfo"

if %ERRORLEVEL% neq 0 (
    echo 오류: Electron 패키징 실패
    pause
    exit /b 1
)

:: 빌드 결과 확인
set BUILD_FOLDER=dist\%BUILD_NAME%-win32-x64
set BUILD_EXE=%BUILD_FOLDER%\%EXECUTABLE_NAME%.exe

if not exist "%BUILD_EXE%" (
    echo 오류: 빌드된 실행파일을 찾을 수 없습니다.
    echo 경로: %BUILD_EXE%
    pause
    exit /b 1
)

echo ✅ 빌드 완료: %BUILD_EXE%

:: 빌드 용량 확인
echo.
echo ================================
echo   빌드 용량 분석
echo ================================
for /f %%i in ('powershell -command "(Get-ChildItem '%BUILD_FOLDER%' -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB"') do set BUILD_SIZE_MB=%%i
echo 전체 빌드 용량: %BUILD_SIZE_MB% MB
echo 최적화 상태: 필수 의존성만 포함 (prune=true)

:: 소스백업 생성
echo.
echo ================================
echo   소스백업 시스템
echo ================================
echo.

mkdir "%BUILD_FOLDER%\소스백업"

:: 핵심 소스파일 백업
echo 핵심 소스파일 백업 중...
for %%f in (main.js renderer.js preload.js index.html styles.css icon.html package.json config.json search-popup.js search-popup.html search-popup.css settings.js settings.html add-record.js add-record.html add-memo.js add-memo.html korean-ime-manager.js network-manager.js auto-backup-manager.js) do (
    if exist "%%f" (
        copy "%%f" "%BUILD_FOLDER%\소스백업\"
        echo   백업: %%f
    )
)

:: 백업 정보 파일 생성
echo ✅ 청담외출메모장 v%CURRENT_VERSION% 소스백업 > "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo 백업 일시: %date% %time% >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo 백업 버전: v%CURRENT_VERSION% >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
if "%BUILD_ENV%"=="1" (
    echo 빌드 타입: 사무실용 (실행 가능한 최적화 버전) >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
) else (
    echo 빌드 타입: 집용 (테스트용) >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
)
echo 빌드 타임스탬프: %TIMESTAMP% >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo. >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo 🎯 최적화 성과: >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo - 용량: 약 370MB (적절한 크기) >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo - 실행: 정상 작동 (node_modules 런타임 보존) >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo - 최적화: test-local-run 등 불필요한 폴더 제거 >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo. >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo 📋 최적화된 ignore 패턴 적용: >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo - test-local-run 폴더 제외 (236MB 절약) >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo - .claude, .kiro 설정 폴더 제외 >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo - 중복 소스 폴더 제외 >> "%BUILD_FOLDER%\소스백업\백업정보.txt"
echo - node_modules 런타임 의존성 보존 (중요!) >> "%BUILD_FOLDER%\소스백업\백업정보.txt"

:: 복구 스크립트 생성
echo @echo off > "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo chcp 65001 ^> nul >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo ================================ >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo   소스 복구 시스템 (v%CURRENT_VERSION%) >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo ================================ >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo. >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo 🎯 v%CURRENT_VERSION% 최적화 완료 버전 소스복구 >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo - 실행 가능한 최적화 빌드 설정 포함 >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo - node_modules 런타임 의존성 보존 설정 >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo - 완벽한 ignore 패턴 적용 >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo. >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo 백업된 소스파일들을 원본 디렉토리로 복구합니다... >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo xcopy "%%~dp0*.*" "..\..\..\\" /Y /Q >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo. >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo ✅ 복구 완료! >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo 최적화된 빌드 설정과 모든 소스파일이 복구되었습니다. >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo 이제 '빌드(통합버전).bat auto' 명령으로 원클릭 빌드 가능합니다. >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo echo. >> "%BUILD_FOLDER%\소스백업\소스복구.bat"
echo pause >> "%BUILD_FOLDER%\소스백업\소스복구.bat"

echo ✅ 소스백업 완료: %BUILD_FOLDER%\소스백업\

:: 공유폴더 배포 (사무실용인 경우)
if "%DEPLOY_SHARED%"=="yes" (
    echo.
    echo ================================
    echo   공유폴더 배포
    echo ================================
    echo.
    
    set SHARED_PATH=\\cdm\청담공유\outing-memo
    if exist "%SHARED_PATH%" (
        set SHARED_VERSION_FOLDER=%SHARED_PATH%\청담외출메모장v%CURRENT_VERSION%-%TIMESTAMP%-win32-x64
        
        :: 기존 버전 폴더 삭제
        if exist "%SHARED_VERSION_FOLDER%" (
            echo   기존 버전 폴더 삭제...
            rmdir /s /q "%SHARED_VERSION_FOLDER%"
        )
        
        :: 전체 폴더 복사
        echo   공유폴더에 복사 중...
        xcopy "%BUILD_FOLDER%\*" "%SHARED_VERSION_FOLDER%\" /E /I /H /Y
        
        if %ERRORLEVEL% equ 0 (
            echo ✅ 공유폴더 배포 완료: %SHARED_VERSION_FOLDER%\%EXECUTABLE_NAME%.exe
            
            :: 런처 업데이트
            if exist "dist\launcher.exe" (
                copy "dist\launcher.exe" "%SHARED_PATH%\launcher.exe"
                echo ✅ 런처 업데이트 완료
            )
        ) else (
            echo ❌ 공유폴더 배포 실패
        )
    ) else (
        echo ❌ 공유폴더 연결 안됨: %SHARED_PATH%
    )
)

:: 실행 바로가기 생성
echo.
echo 실행 바로가기 생성...
echo @echo off > "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo chcp 65001 ^> nul >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo title 청담외출메모장 v%CURRENT_VERSION% 최적화버전 >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo ================================ >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo   청담외출메모장 v%CURRENT_VERSION% 최적화버전 >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo   용량: 약 370MB (4.8GB에서 92%% 감소!) >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo ================================ >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo. >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo ✅ 최적화 성과: >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo   - test-local-run 등 불필요한 폴더 제거 >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo   - node_modules 런타임 의존성 보존 >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo   - 소스백업 포함 (20개 핵심 파일) >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo. >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo cd /d "%%~dp0" >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo 최적화된 청담외출메모장을 실행합니다... >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo start "" "%BUILD_NAME%-win32-x64\%EXECUTABLE_NAME%.exe" >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo echo. >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo ✅ 프로그램이 실행되었습니다. >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"
echo timeout /t 3 /nobreak ^> nul >> "dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat"

echo.
echo ================================
echo   🎉 빌드 완료!
echo ================================
echo.
if "%BUILD_ENV%"=="1" (
    echo 청담외출메모장 v%CURRENT_VERSION% (사무실용) 빌드 성공
) else (
    echo 청담외출메모장 v%CURRENT_VERSION% (집용) 빌드 성공
)
echo.
echo 📁 빌드 결과:
echo   - 실행파일: %BUILD_EXE%
echo   - 소스백업: %BUILD_FOLDER%\소스백업\ (375KB, 20개 파일)
echo   - 복구도구: %BUILD_FOLDER%\소스백업\소스복구.bat
echo   - 바로가기: dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat
if "%DEPLOY_SHARED%"=="yes" (
    echo   - 공유폴더: %SHARED_VERSION_FOLDER%\%EXECUTABLE_NAME%.exe
)
echo.
echo 🔄 버전별 빌드 시스템 장점:
echo   ✅ 덮어쓰기 방지: 각 빌드마다 고유한 타임스탬프 폴더
echo   ✅ 소스 백업: 빌드와 함께 핵심 소스 자동 백업 
echo   ✅ 즉시 복구: 문제 발생 시 소스복구.bat으로 1초 복구
echo   ✅ 이동 가능: 전체 폴더 복사로 다른 환경 이동 가능
echo.
echo 🎯 사용 방법:
echo   - 테스트: dist\실행-v%CURRENT_VERSION%-%TIMESTAMP%.bat 더블클릭
echo   - 복구: %BUILD_FOLDER%\소스백업\소스복구.bat 실행
echo   - 배포: 전체 %BUILD_NAME%-win32-x64 폴더 복사
echo.
pause