@echo off
chcp 65001 > nul
title Dung toan bo dich vu TDTU Note App
cd /d "%~dp0"

echo ===============================================================================
echo                DUNG TOAN BO CAC DICH VU CUA TDTU NOTE APP
echo ===============================================================================
echo.

echo Dang dong cac tien trinh cong 8000 (Backend PHP)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

echo Dang dong cac tien trinh cong 5001 (WebSocket Server)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

echo Dang dong cac tien trinh cong 5173 (Frontend React Vite)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

taskkill /F /IM php.exe 2>nul

echo.
echo [THANH CONG] Toan bo may chu PHP, WebSocket va Vite da duoc dung an toan.
echo.
timeout /t 2 /nobreak >nul
exit /b 0
