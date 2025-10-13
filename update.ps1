# PowerShell Blog Update Script
$ErrorActionPreference = "Continue"

Write-Host "========================================"  -ForegroundColor Cyan
Write-Host "  Blog Update Script (PowerShell)"  -ForegroundColor Cyan
Write-Host "========================================"  -ForegroundColor Cyan
Write-Host ""

# Check if we're in the correct directory
if (-not (Test-Path "update-blog-images-final.js")) {
    Write-Host "[ERROR] update-blog-images-final.js not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

try {
    # Step 1: Cleanup
    Write-Host "[1/5] Cleaning up previous installation..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Write-Host "  - Removing node_modules folder..." -ForegroundColor Gray
        Remove-Item -Path "node_modules" -Recurse -Force
        Write-Host "  - node_modules removed successfully" -ForegroundColor Green
    } else {
        Write-Host "  - No node_modules folder found (skip)" -ForegroundColor Gray
    }

    if (Test-Path "package-lock.json") {
        Write-Host "  - Removing package-lock.json..." -ForegroundColor Gray
        Remove-Item -Path "package-lock.json" -Force
        Write-Host "  - package-lock.json removed successfully" -ForegroundColor Green
    } else {
        Write-Host "  - No package-lock.json found (skip)" -ForegroundColor Gray
    }
    Write-Host ""

    # Step 2: Install dependencies
    Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
    $npmInstall = npm install 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] npm install failed!" -ForegroundColor Red
        Write-Host "Please check your internet connection and npm configuration." -ForegroundColor Red
        Write-Host ""
        Write-Host "Error output:" -ForegroundColor Red
        Write-Host $npmInstall -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host $npmInstall
    Write-Host "  - Dependencies installed successfully" -ForegroundColor Green
    Write-Host ""

    # Step 3: Run update script
    Write-Host "[3/5] Running Update Script..." -ForegroundColor Yellow
    $nodeOutput = node update-blog-images-final.js 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "[ERROR] Update script failed!" -ForegroundColor Red
        Write-Host "Please check the error messages above." -ForegroundColor Red
        Write-Host ""
        Write-Host "Error output:" -ForegroundColor Red
        Write-Host $nodeOutput -ForegroundColor Red
        Write-Host ""
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host $nodeOutput
    Write-Host "  - Update script completed successfully" -ForegroundColor Green
    Write-Host ""

    # Step 4: Stage changes
    Write-Host "[4/5] Staging changes to Git..." -ForegroundColor Yellow

    # Remove Git lock file if it exists
    $lockFile = ".git\index.lock"
    if (Test-Path $lockFile) {
        Write-Host "  - Removing stale Git lock file..." -ForegroundColor Gray
        Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
    }

    # Add specific files only (avoid adding node_modules and reserved names)
    $filesToAdd = @(
        "images/",
        "index.html",
        ".gitignore"
    )

    foreach ($file in $filesToAdd) {
        if (Test-Path $file) {
            git add $file 2>&1 | Out-Null
        }
    }

    Write-Host "  - Changes staged successfully" -ForegroundColor Green
    Write-Host ""

    # Step 5: Commit and push
    Write-Host "[5/5] Committing and pushing changes..." -ForegroundColor Yellow
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMsg = "Blog Update: $timestamp"

    $gitCommit = git commit -m $commitMsg 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Check if there are no changes to commit
        if ($gitCommit -match "nothing to commit") {
            Write-Host "  - No changes to commit (this is OK)" -ForegroundColor Gray
        } else {
            Write-Host ""
            Write-Host "[ERROR] git commit failed!" -ForegroundColor Red
            Write-Host $gitCommit -ForegroundColor Red
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit 1
        }
    } else {
        Write-Host "  - Changes committed successfully" -ForegroundColor Green
        Write-Host "  - Pushing to remote repository..." -ForegroundColor Gray

        $gitPush = git push 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "[ERROR] git push failed!" -ForegroundColor Red
            Write-Host "Please check your internet connection and git credentials." -ForegroundColor Red
            Write-Host ""
            Write-Host "Error output:" -ForegroundColor Red
            Write-Host $gitPush -ForegroundColor Red
            Write-Host ""
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host $gitPush
        Write-Host "  - Changes pushed successfully" -ForegroundColor Green
    }
    Write-Host ""

    Write-Host "========================================"  -ForegroundColor Cyan
    Write-Host "  All tasks completed successfully!"  -ForegroundColor Green
    Write-Host "========================================"  -ForegroundColor Cyan
    Write-Host ""
}
catch {
    Write-Host ""
    Write-Host "[ERROR] An unexpected error occurred!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor Gray
    Write-Host $_.ScriptStackTrace -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Read-Host "Press Enter to exit"
