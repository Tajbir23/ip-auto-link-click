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
echo 0. Start New Server (npm run dev)
echo 9. Exit
set /p sel="Select a server by number, or choose 0/9: "
if "%sel%"=="0" (
    echo Starting server in new window...
    start "IP Auto Link Click Server" cmd /k "npm run dev"
    timeout /t 5 >nul
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