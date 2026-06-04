@echo off
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr "192.168.240"') do set IP=%%a
set IP=%IP: =%

echo Updating .env with IP: %IP%

powershell -Command "(Get-Content .env) -replace 'APP_URL=http://.*', 'APP_URL=http://%IP%:8000' | Set-Content .env"
powershell -Command "(Get-Content .env) -replace 'FRONTEND_URL=http://.*', 'FRONTEND_URL=http://%IP%:5173' | Set-Content .env"
powershell -Command "(Get-Content vite.config.js) -replace 'host: ''192.*''', 'host: ''%IP%''' | Set-Content vite.config.js"

php artisan config:clear
php artisan cache:clear

echo Done! Now run your servers!
pause