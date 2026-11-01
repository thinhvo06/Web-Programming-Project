@echo off
title Khoi dong TDTU Note App (Backend PHP + MariaDB + WebSocket + Frontend)
chcp 65001 > nul
echo =====================================================================
echo    KHỞI ĐỘNG HỆ THỐNG TDTU NOTE APP (PHP BACK-END THUẦN)
echo =====================================================================

REM 1. Khoi dong MariaDB
echo [1/4] Dang bat MariaDB (Port 3306)...
start "MariaDB Server" /min "D:\tools\mariadb\bin\mariadbd.exe" --datadir="D:\tools\mariadb\data" --port=3306

timeout /t 2 > nul

REM 2. Khoi dong Backend PHP
echo [2/4] Dang bat Backend PHP (Port 8000)...
start "PHP Backend" /min cmd /c "cd /d "%~dp0backend-php" && "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" -S 0.0.0.0:8000 router.php"

REM 3. Khoi dong WebSocket Server
echo [3/4] Dang bat Realtime WebSocket (Port 5001)...
start "WebSocket Realtime" /min cmd /c "cd /d "%~dp0backend-php\realtime-socket" && node server.js"

REM 4. Khoi dong Frontend React (Vite)
echo [4/4] Dang bat Frontend Vite (Port 5173)...
start "Frontend Vite" /min cmd /c "cd /d "%~dp0frontend" && npm run dev -- --host 0.0.0.0 --port 5173"

echo.
echo =====================================================================
echo    TẤT CẢ DỊCH VỤ ĐÃ ĐƯỢC KHỞI CHẠY THÀNH CÔNG!
echo    - Frontend App:    http://localhost:5173
echo    - Backend PHP API: http://localhost:8000
echo    - WebSocket:       http://localhost:5001
echo    - MariaDB MySQL:   Port 3306 (Database: tdtu_note_app)
echo =====================================================================
timeout /t 3 > nul
start http://localhost:5173
exit
