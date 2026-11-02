@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

echo =====================================================================
echo    STARTING TDTU NOTE APP (PHP Backend + MariaDB + Socket + Vite)
echo =====================================================================

REM 1. Start MariaDB / MySQL if not running on port 3306
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [1/4] Checking and starting MariaDB/MySQL on port 3306...
    sc query MariaDB >nul 2>&1
    if not errorlevel 1 (
        net start MariaDB >nul 2>&1
    ) else (
        sc query MySQL >nul 2>&1
        if not errorlevel 1 (
            net start MySQL >nul 2>&1
        )
    )
    netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
    if errorlevel 1 (
        if exist "C:\Program Files\MariaDB 13.0\bin\mariadbd.exe" (
            start "MariaDB-Server" "C:\Program Files\MariaDB 13.0\bin\mariadbd.exe" --console
        ) else if exist "D:\tools\mariadb\bin\mariadbd.exe" (
            start "MariaDB-Server" "D:\tools\mariadb\bin\mariadbd.exe" --datadir="D:\tools\mariadb\data" --port=3306 --console
        ) else if exist "C:\xampp\mysql\bin\mysqld.exe" (
            start "MySQL-Server" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        )
    )
) else (
    echo [1/4] MariaDB/MySQL is already running on port 3306.
)

REM 2. Locate PHP executable
set "PHP_EXE="
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" (
    set "PHP_EXE=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
) else if exist "C:\xampp\php\php.exe" (
    set "PHP_EXE=C:\xampp\php\php.exe"
) else (
    for /f "delims=" %%I in ('where php.exe 2^>nul') do (
        if not defined PHP_EXE set "PHP_EXE=%%I"
    )
)

if not defined PHP_EXE (
    echo [ERROR] PHP executable not found! Please install PHP or XAMPP.
    pause
    exit /b 1
)

REM Start PHP Backend on port 8000
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [2/4] Starting PHP backend on port 8000...
    pushd "%~dp0backend-php"
    start "PHP-Backend" cmd /k ""%PHP_EXE%" -S 0.0.0.0:8000 router.php"
    popd
) else (
    echo [2/4] PHP backend is already running on port 8000.
)

REM 3. Start WebSocket Server on port 5001
netstat -ano | findstr ":5001" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [3/4] Starting WebSocket server on port 5001...
    pushd "%~dp0backend-php\realtime-socket"
    start "WebSocket-Server" cmd /k "npm start"
    popd
) else (
    echo [3/4] WebSocket server is already running on port 5001.
)

REM 4. Start Frontend Vite on port 5173
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo [4/4] Starting Frontend Vite on port 5173...
    pushd "%~dp0frontend"
    start "Frontend-Vite" cmd /k "npm run dev -- --host 0.0.0.0 --port 5173"
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

REM Auto open browser after 2 seconds
ping 127.0.0.1 -n 3 >nul
start http://localhost:5173
exit /b 0
