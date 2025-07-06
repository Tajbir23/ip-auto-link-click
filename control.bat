@echo off
setlocal enabledelayedexpansion

:main_menu
cls
echo.
echo === IP Auto Link Click Servers ===
echo.

:: Build a list of running server ports
set i=0
set "ports="
for %%f in (server-*.pid) do (
    set "filename=%%~nf"
    set "port=!filename:~7!"
    set /a i+=1
    set "port_!i!=!port!"
    set "ports=!ports! !port!"
)
set "server_count=!i!"

if !server_count! == 0 (
    echo No running servers found.
) else (
    echo Running servers:
    set i=0
    for %%p in (!ports!) do (
        set /a i+=1
        echo   !i!. Port %%p
    )
)

echo.
echo === Current Branch ===
git branch --show-current > temp_branch.txt
set /p current_branch=<temp_branch.txt
del temp_branch.txt
echo Current: %current_branch%
echo.
echo 0. Start New Server (npm run dev)
echo 7. Switch Git Branch
echo 8. Show All Branches
echo 9. Exit
set /p sel="Select a server by number, or choose 0/7/8/9: "

if "%sel%"=="0" (
    echo Starting server in new window...
    start "IP Auto Link Click Server" cmd /k "npm run dev"
    timeout /t 5 >nul
    goto main_menu
)
if "%sel%"=="7" (
    call :switch_branch
    goto main_menu
)
if "%sel%"=="8" (
    call :show_branches
    goto main_menu
)
if "%sel%"=="9" exit

:: Validate selection
set /a selnum=%sel% 2>nul
if %selnum% lss 1 goto main_menu
if %selnum% gtr !server_count! goto main_menu

:: Get selected port
for /f "tokens=2 delims== " %%a in ('set port_%selnum%') do set "selected_port=%%a"

:server_menu
cls
echo.
echo === Server running on port !selected_port! ===

:: Show counts
for /f "tokens=* usebackq" %%a in (`curl -s http://localhost:!selected_port!/total-work-count`) do (
    set total=%%a
)
for /f "tokens=* usebackq" %%a in (`curl -s http://localhost:!selected_port!/today-work-count`) do (
    set today=%%a
)
echo Total Work Count: !total!
echo Today's Work Count: !today!
echo.
echo Choose an option for port !selected_port!:
echo 1. Open Scraping
echo 2. Reset IP
echo 3. Stop Scraping
echo 4. Resume Scraping
echo 5. Back to Server List
echo 9. Exit
set /p choice="Enter your choice (1-5/9): "
if "%choice%"=="1" start http://localhost:!selected_port!
if "%choice%"=="2" start http://localhost:!selected_port!/reset-ip
if "%choice%"=="3" start http://localhost:!selected_port!/stop-scrape
if "%choice%"=="4" start http://localhost:!selected_port!/resume-scrape
if "%choice%"=="5" goto main_menu
if "%choice%"=="9" exit
goto server_menu

:show_branches
cls
echo.
echo === Git Branches ===
echo.
echo Local branches:
git branch
echo.
echo Remote branches:
git branch -r
echo.
pause
goto main_menu

:switch_branch
cls
echo.
echo === Switch Git Branch ===
echo.
echo Available branches:

:: Create temporary files
set "temp_local=temp_local.txt"
set "temp_remote=temp_remote.txt"

:: Get local branches
git branch --format=%%(refname:short) > "%temp_local%"

:: Get remote branches
git branch -r --format=%%(refname:short) | findstr /v "HEAD" | findstr /v /r /c:".*->.*" > "%temp_remote%"

:: Build list of all branches
set branch_count=0
set "branches="

:: Add local branches
for /f "tokens=*" %%a in (%temp_local%) do (
    set /a branch_count+=1
    set "branch_!branch_count!=%%a"
    set "branches=!branches! %%a"
    echo !branch_count!. %%a
)

:: Add remote branches
for /f "tokens=*" %%a in (%temp_remote%) do (
    set "remote_branch=%%a"
    set "remote_branch=!remote_branch:origin/=!"
    
    :: Check if branch is already in local list
    echo !branches! | findstr /i /c:"!remote_branch!" >nul
    if errorlevel 1 (
        set /a branch_count+=1
        set "branch_!branch_count!=!remote_branch!"
        echo !branch_count!. !remote_branch! (remote)
    )
)

:: Clean up temporary files
del "%temp_local%" 2>nul
del "%temp_remote%" 2>nul

echo.
echo 0. Back to main menu
set /p branch_sel="Select branch number (0 to cancel): "

if "%branch_sel%"=="0" goto main_menu

:: Validate selection
set /a selnum=%branch_sel% 2>nul
if %selnum% lss 1 (
    echo Invalid selection.
    pause
    goto main_menu
)
if %selnum% gtr !branch_count! (
    echo Invalid selection.
    pause
    goto main_menu
)

:: Get selected branch name
for /f "tokens=2 delims== " %%a in ('set branch_%branch_sel%') do set "selected_branch=%%a"

:: Check if the branch exists locally
git rev-parse --verify %selected_branch% >nul 2>nul
if errorlevel 1 (
    :: Check if it's a remote branch
    git rev-parse --verify origin/%selected_branch% >nul 2>nul
    if errorlevel 1 (
        echo Branch %selected_branch% not found.
        pause
        goto main_menu
    )
    :: If it's a remote branch, create a local tracking branch
    echo Creating local tracking branch for origin/%selected_branch%...
    git checkout -b %selected_branch% origin/%selected_branch%
) else (
    :: If it's a local branch, just switch to it
    echo Switching to branch %selected_branch%...
    git checkout %selected_branch%
)

:: Install dependencies after branch switch
echo.
echo Installing dependencies...
call npm install
echo.
echo Branch switched and dependencies installed.
pause
goto main_menu 