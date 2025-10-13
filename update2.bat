@echo off
chcp 65001 > nul

REM --- Already in the project directory ---
REM cd mamanim123.github.io-main

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
git commit -m "Blog Update: %date% %time%"
git push

echo All tasks completed.
pause
