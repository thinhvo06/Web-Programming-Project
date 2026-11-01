@echo off
setlocal
cd /d "%~dp0"

echo =====================================================================
echo    STARTING TDTU NOTE APP (PHP Backend + MariaDB + Socket + Vite)
echo =====================================================================

REM 1. Start MariaDB if not running
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [1/4] Starting MariaDB on port 3306...
    start "MariaDB-Server" "D:\tools\mariadb\bin\mariadbd.exe" --datadir="D:\tools\mariadb\data" --port=3306 --console
) else (
    echo [1/4] MariaDB is already running on port 3306.
)

REM 2. Start PHP Backend
set "PHP_EXE=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [2/4] Starting PHP backend on port 8000...
    pushd "%~dp0backend-php"
    start "PHP-Backend" "%PHP_EXE%" -S 0.0.0.0:8000 router.php
    popd
) else (
    echo [2/4] PHP backend is already running on port 8000.
)

REM 3. Start WebSocket Server
netstat -ano | findstr ":5001" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [3/4] Starting WebSocket server on port 5001...
    pushd "%~dp0backend-php\realtime-socket"
    start "WebSocket-Server" node server.js
    popd
) else (
    echo [3/4] WebSocket server is already running on port 5001.
)

REM 4. Start Frontend Vite
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [4/4] Starting Frontend Vite on port 5173...
    pushd "%~dp0frontend"
    start "Frontend-Vite" cmd /c "npm run dev -- --host 0.0.0.0 --port 5173"
    popd
) else (
    echo [4/4] Frontend Vite is already running on port 5173.
)

echo.
echo =====================================================================
echo    ALL SERVICES RUNNING!
echo    - Frontend App:    http://localhost:5173
echo    - Backend PHP API: http://localhost:8000
echo    - WebSocket:       http://localhost:5001
echo    - MariaDB MySQL:   Port 3306 (Database: tdtu_note_app)
echo =====================================================================
exit /b 0
