@echo off
setlocal enabledelayedexpansion

:menu
cls
echo.
echo === This is for fucking ip auto link click ===
echo.

:: Show counts
for /f "tokens=* usebackq" %%a in (`curl -s http://localhost:3000/total-work-count`) do (
    set total=%%a
)
for /f "tokens=* usebackq" %%a in (`curl -s http://localhost:3000/today-work-count`) do (
    set today=%%a
)

echo Total Work Count: %total%
echo Today's Work Count: %today%
echo.
echo Choose an option:
echo 0. Start Server (npm run dev)
echo 1. Stop Server
echo 2. Start Scraping
echo 3. Reset IP
echo 4. Stop Scraping
echo 5. Resume Scraping
echo 6. Exit
echo.

set /p choice="Enter your choice (0-6): "

if "%choice%"=="0" (
    echo Starting server in new window...
    start "IP Auto Link Click Server" cmd /k "npm run dev"
    echo Waiting for server to start...
    timeout /t 5 >nul
    goto menu
)

if "%choice%"=="1" (
    echo Stopping server...
    taskkill /F /IM node.exe
    echo Server stopped.
    timeout /t 2 >nul
    goto menu
)

if "%choice%"=="2" (
    start http://localhost:3000
    echo Opening browser for scraping...
    timeout /t 2 >nul
    goto menu
)

if "%choice%"=="3" (
    start http://localhost:3000/reset-ip
    echo Opening browser for IP reset...
    timeout /t 2 >nul
    goto menu
)

if "%choice%"=="4" (
    start http://localhost:3000/stop-scrape
    echo Opening browser to stop scraping...
    timeout /t 2 >nul
    goto menu
)

if "%choice%"=="5" (
    start http://localhost:3000/resume-scrape
    echo Opening browser to resume scraping...
    timeout /t 2 >nul
    goto menu
)

if "%choice%"=="6" (
    echo Exiting...
    exit
)

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto menu 