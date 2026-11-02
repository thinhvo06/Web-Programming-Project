@echo off
chcp 65001 > nul
title Dừng toàn bộ dịch vụ TDTU Note App
cd /d "%~dp0"

echo ===============================================================================
echo                DỪNG TOÀN BỘ CÁC DỊCH VỤ CỦA TDTU NOTE APP
echo ===============================================================================
echo.

echo Đang đóng các tiến trình cổng 8000 (Backend PHP)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

echo Đang đóng các tiến trình cổng 5001 (WebSocket Server)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

echo Đang đóng các tiến trình cổng 5173 (Frontend React Vite)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

taskkill /F /IM php.exe 2>nul

echo.
echo [THÀNH CÔNG] Toàn bộ máy chủ PHP, WebSocket và Vite đã được dừng an toàn.
echo.
timeout /t 2 /nobreak >nul
exit /b 0
