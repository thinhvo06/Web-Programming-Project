@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title TDTU Note App - 1-Click Launcher (Run All Services)
cd /d "%~dp0"

echo ===============================================================================
echo     DAI HOC TON DUC THANG - MON 503073: LAP TRINH VA UNG DUNG WEB
echo          KHOI CHAY HE THONG UNG DUNG QUAN LY GHI CHU (TDTU NOTE APP)
echo ===============================================================================
echo.

REM -----------------------------------------------------------------------------
REM 1. KIEM TRA VA KHOI DONG CO SO DU LIEU MYSQL / MARIADB (PORT 3306)
REM -----------------------------------------------------------------------------
echo [1/5] Kiem tra ket noi CSDL MySQL / MariaDB (Port 3306)...
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if !errorlevel! equ 0 (
    echo     [OK] CSDL MySQL/MariaDB dang hoat dong binh thuong tren cong 3306.
) else (
    echo     -> Cong 3306 chua mo, dang thu khoi dong dich vu he thong...
    sc query MariaDB >nul 2>&1 && net start MariaDB >nul 2>&1
    sc query MySQL >nul 2>&1 && net start MySQL >nul 2>&1
    netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
    if !errorlevel! equ 0 (
        echo     [OK] CSDL MySQL/MariaDB da san sang tren cong 3306.
    ) else (
        echo     [LUU Y] Cong 3306 chua mo.
        echo     Neu su dung XAMPP, vui long bam Start MySQL tren XAMPP Control Panel.
    )
)

REM -----------------------------------------------------------------------------
REM 2. TIM KIEM TRINH THONG DICH PHP (PHP EXECUTABLE)
REM -----------------------------------------------------------------------------
echo.
echo [2/5] Kiem tra trinh thong dich PHP...
set "PHP_EXE="

for /f "delims=" %%I in ('where php.exe 2^>nul') do if not defined PHP_EXE set "PHP_EXE=%%I"
if not defined PHP_EXE if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" set "PHP_EXE=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
if not defined PHP_EXE if exist "C:\xampp\php\php.exe" set "PHP_EXE=C:\xampp\php\php.exe"
if not defined PHP_EXE if exist "C:\tools\php\php.exe" set "PHP_EXE=C:\tools\php\php.exe"
if not defined PHP_EXE if exist "D:\tools\php\php.exe" set "PHP_EXE=D:\tools\php\php.exe"

if not defined PHP_EXE (
    echo [LOI] Khong tim thay php.exe! Vui long cai dat PHP hoac mo XAMPP.
    pause
    exit /b 1
)
echo     [OK] Da tim thay PHP tai: !PHP_EXE!

REM -----------------------------------------------------------------------------
REM 3. KIEM TRA THU VIEN NODE_MODULES
REM -----------------------------------------------------------------------------
echo.
echo [3/5] Kiem tra goi thu vien npm (node_modules)...
if not exist "backend-php\realtime-socket\node_modules\" (
    echo     -> Dang tu dong cai dat thu vien cho WebSocket Server...
    pushd "%~dp0backend-php\realtime-socket"
    call npm.cmd install --loglevel=error
    popd
)

if not exist "frontend\node_modules\" (
    echo     -> Dang tu dong cai dat thu vien cho Frontend Vite...
    pushd "%~dp0frontend"
    call npm.cmd install --loglevel=error
    popd
)
echo     [OK] Thu vien npm da day du va san sang.

REM -----------------------------------------------------------------------------
REM 4. KHOI CHAY BACKEND PHP, WEBSOCKET SERVER & FRONTEND VITE
REM -----------------------------------------------------------------------------
echo.
echo [4/5] Khoi dong cac dich vu may chu...

REM Start PHP Backend on port 8000
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if !errorlevel! neq 0 (
    echo     -> Khoi chay Backend PHP API tai cong 8000...
    pushd "%~dp0backend-php"
    start "TDTU-PHP-Backend" /d "%~dp0backend-php" cmd /k ""!PHP_EXE!" -S 0.0.0.0:8000 -t "%~dp0backend-php" router.php"
    popd
) else (
    echo     [OK] Backend PHP API da dang chay o cong 8000.
)

REM Start WebSocket Server on port 5001
netstat -ano | findstr ":5001" | findstr "LISTENING" >nul
if !errorlevel! neq 0 (
    echo     -> Khoi chay Realtime WebSocket Server tai cong 5001...
    pushd "%~dp0backend-php\realtime-socket"
    start "TDTU-WebSocket-Server" cmd /k "npm.cmd start"
    popd
) else (
    echo     [OK] Realtime WebSocket Server da dang chay o cong 5001.
)

REM Start Frontend Vite on port 5173
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if !errorlevel! neq 0 (
    echo     -> Khoi chay Frontend React Vite tai cong 5173...
    pushd "%~dp0frontend"
    start "TDTU-Frontend-Vite" cmd /k "npm.cmd run dev -- --host 0.0.0.0 --port 5173"
    popd
) else (
    echo     [OK] Frontend React Vite da dang chay o cong 5173.
)

REM -----------------------------------------------------------------------------
REM 5. HOAN TAT & HUONG DAN TRUY CAP
REM -----------------------------------------------------------------------------
echo.
echo [5/5] Hoan tat khoi dong he thong!
echo.
echo ===============================================================================
echo                           HE THONG DA SAN SANG DE SU DUNG
echo ===============================================================================
echo  * Ung dung Web (Frontend):    http://localhost:5173
echo  * API May chu (Backend):      http://localhost:8000/api
echo  * May chu WebSocket:          http://localhost:5001
echo  * CSDL MariaDB/MySQL:         Port 3306 (Ten CSDL: tdtu_note_app)
echo -------------------------------------------------------------------------------
echo  TAI KHOAN MAU CO SAN DU LIEU DE KIEM TRA:
echo  1. Tai khoan Owner:           student1@tdtu.edu.vn  / password123
echo     (Co note ghim, note khoa pass: note123456, note chia se, nhan, file dinh kem)
echo  2. Tai khoan Collaborator:    student2@tdtu.edu.vn  / password123
echo     (Xem muc 'Duoc chia se' de test sync dong thoi va con tro pointer)
echo  3. Tai khoan chua kich hoat:  unverified@tdtu.edu.vn / password123
echo     (Kiem tra banner canh bao kich hoat tai khoan)
echo -------------------------------------------------------------------------------
echo  * De dung toan bo he thong, ban co the chay file: stop.bat
echo ===============================================================================
echo.
echo Dang mo trinh duyet vao http://localhost:5173 trong 2 giay...
ping 127.0.0.1 -n 3 >nul
start http://localhost:5173
exit /b 0
