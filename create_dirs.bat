@echo off
setlocal enabledelayedexpansion
cd /d C:\Users\nilel\project\sudan\CoffeeCraze.worktrees\agents-coffee-craze-production-system-setup

mkdir src\config
mkdir src\api\middleware
mkdir src\api\routes
mkdir src\api\services
mkdir src\api\utils
mkdir scripts

REM Create .gitkeep files
echo. > src\config\.gitkeep
echo. > src\api\middleware\.gitkeep
echo. > src\api\routes\.gitkeep
echo. > src\api\services\.gitkeep
echo. > src\api\utils\.gitkeep
echo. > scripts\.gitkeep

echo SUCCESS
