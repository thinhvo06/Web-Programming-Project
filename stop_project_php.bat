@echo off
title Dung TDTU Note App Services
chcp 65001 > nul
echo Dang dung cac dich vu cua project TDTU Note App...

REM Kill PHP backend on port 8000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

REM Kill WebSocket on port 5001
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5001" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

REM Kill Vite on port 5173
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

taskkill /F /IM php.exe 2>nul
echo Da dung toan bo cac dich vu Web Final (PHP, WebSocket, Vite).
timeout /t 2 /nobreak >nul
