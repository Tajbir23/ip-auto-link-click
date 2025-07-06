@echo off
echo Installing PM2 globally if not installed...
call npm list -g pm2 || npm install -g pm2

echo Starting server with PM2...
call pm2 delete ip-auto-click 2>nul
call pm2 start index.js --name "ip-auto-click"
call pm2 save

echo Creating Windows Startup Task...
set "SCRIPT_PATH=%~dp0"
schtasks /create /tn "IP Auto Click Server" /tr "cmd /c cd /d %SCRIPT_PATH% && pm2 resurrect" /sc onstart /ru SYSTEM /f

echo Opening server URL...
start http://localhost:3000

echo Setup complete! The server will now start automatically when Windows boots.
echo You can manage the server using these commands:
echo   pm2 status    - Check server status
echo   pm2 logs      - View logs
echo   pm2 stop ip-auto-click    - Stop server
echo   pm2 restart ip-auto-click - Restart server
pause 