@echo off

set "file_content=@echo off
chcp 65001 > nul
echo 🎯 청담재활 블로그 완전 자동 업데이트 시작!
echo.

cd mamanim123.github.io-main

echo Cleaning up previous installation...
if exist "node_modules" (
    rmdir /s /q node_modules
)
if exist "package-lock.json" (
    del package-lock.json
)

echo Installing dependencies...
npm install

echo Running Update Script...
node update-blog-images-final.js

echo Pushing changes to Git...
git add .
git commit -m "Blog Update: %%date%% %%time%%"
git push

echo All tasks completed.
pause"

powershell -Command "[System.IO.File]::WriteAllText('update.bat', '%file_content%', [System.Text.Encoding]::UTF8)"

del create_update_script.bat
