@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul
title TDTU Note App - 1-Click Launcher (Run All Services)
cd /d "%~dp0"

echo ===============================================================================
echo     ĐẠI HỌC TÔN ĐỨC THẮNG - MÔN 503073: LẬP TRÌNH VÀ ỨNG DỤNG WEB
echo          KHỞI CHẠY HỆ THỐNG ỨNG DỤNG QUẢN LÝ GHI CHÚ (TDTU NOTE APP)
echo ===============================================================================
echo.

REM -----------------------------------------------------------------------------
REM 1. KIỂM TRA VÀ KHỞI ĐỘNG CƠ SỞ DỮ LIỆU MYSQL / MARIADB (PORT 3306)
REM -----------------------------------------------------------------------------
echo [1/5] Kiểm tra dịch vụ CSDL MySQL / MariaDB (Port 3306)...
netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo     -> Cổng 3306 chưa mở, đang thử khởi động dịch vụ MySQL / MariaDB...
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
        if exist "C:\xampp\mysql\bin\mysqld.exe" (
            start "MySQL-Server" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        ) else if exist "C:\Program Files\MariaDB 13.0\bin\mariadbd.exe" (
            start "MariaDB-Server" "C:\Program Files\MariaDB 13.0\bin\mariadbd.exe" --console
        ) else if exist "D:\tools\mariadb\bin\mariadbd.exe" (
            start "MariaDB-Server" "D:\tools\mariadb\bin\mariadbd.exe" --datadir="D:\tools\mariadb\data" --port=3306 --console
        )
    )
    timeout /t 2 /nobreak >nul
    netstat -ano | findstr ":3306" | findstr "LISTENING" >nul
    if errorlevel 1 (
        echo     [CẢNH BÁO] Không thể tự động mở cổng 3306.
        echo     Vui lòng đảm bảo đã bật MySQL trong XAMPP hoặc cài đặt MariaDB trước khi test!
    ) else (
        echo     -> CSDL MySQL/MariaDB đã sẵn sàng trên cổng 3306.
    )
) else (
    echo     -> CSDL MySQL/MariaDB đang hoạt động bình thường trên cổng 3306.
)

REM -----------------------------------------------------------------------------
REM 2. TÌM KIẾM BỘ THỰC THI PHP (PHP EXECUTABLE)
REM -----------------------------------------------------------------------------
echo.
echo [2/5] Kiểm tra trình thông dịch PHP...
set "PHP_EXE="
if exist "%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" (
    set "PHP_EXE=%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.2_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"
) else if exist "C:\xampp\php\php.exe" (
    set "PHP_EXE=C:\xampp\php\php.exe"
) else if exist "C:\tools\php\php.exe" (
    set "PHP_EXE=C:\tools\php\php.exe"
) else (
    for /f "delims=" %%I in ('where php.exe 2^>nul') do (
        if not defined PHP_EXE set "PHP_EXE=%%I"
    )
)

if not defined PHP_EXE (
    echo [LỖI] Không tìm thấy php.exe! Vui lòng cài đặt PHP hoặc mở XAMPP.
    pause
    exit /b 1
)
echo     -> Đã tìm thấy PHP tại: %PHP_EXE%

REM -----------------------------------------------------------------------------
REM 3. KIỂM TRA THƯ VIỆN NODE_MODULES (NẾU FILE SUBMISSION ĐÃ ĐƯỢC DỌN DẸP SẠCH)
REM -----------------------------------------------------------------------------
echo.
echo [3/5] Kiểm tra gói thư viện npm (node_modules)...
if not exist "backend-php\realtime-socket\node_modules\" (
    echo     -> Đang tự động cài đặt thư viện cho WebSocket Server (backend-php/realtime-socket)...
    pushd "%~dp0backend-php\realtime-socket"
    call npm.cmd install --loglevel=error
    popd
)

if not exist "frontend\node_modules\" (
    echo     -> Đang tự động cài đặt thư viện cho Frontend Vite (frontend)...
    pushd "%~dp0frontend"
    call npm.cmd install --loglevel=error
    popd
)
echo     -> Thư viện npm đã đầy đủ và sẵn sàng.

REM -----------------------------------------------------------------------------
REM 4. KHỞI CHẠY BACKEND PHP, WEBSOCKET SERVER & FRONTEND VITE
REM -----------------------------------------------------------------------------
echo.
echo [4/5] Khởi động các dịch vụ máy chủ...

REM Start PHP Backend on port 8000
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo     -> Khởi chạy Backend PHP API tại cổng 8000...
    pushd "%~dp0backend-php"
    start "TDTU-PHP-Backend" cmd /k ""%PHP_EXE%" -S 0.0.0.0:8000 router.php"
    popd
) else (
    echo     -> Backend PHP API đã đang chạy ở cổng 8000.
)

REM Start WebSocket Server on port 5001
netstat -ano | findstr ":5001" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo     -> Khởi chạy Realtime WebSocket Server tại cổng 5001...
    pushd "%~dp0backend-php\realtime-socket"
    start "TDTU-WebSocket-Server" cmd /k "npm.cmd start"
    popd
) else (
    echo     -> Realtime WebSocket Server đã đang chạy ở cổng 5001.
)

REM Start Frontend Vite on port 5173
netstat -ano | findstr ":5173" | findstr "LISTENING" >nul
if errorlevel 1 (
    echo     -> Khởi chạy Frontend React Vite tại cổng 5173...
    pushd "%~dp0frontend"
    start "TDTU-Frontend-Vite" cmd /k "npm.cmd run dev -- --host 0.0.0.0 --port 5173"
    popd
) else (
    echo     -> Frontend React Vite đã đang chạy ở cổng 5173.
)

REM -----------------------------------------------------------------------------
REM 5. HOÀN TẤT & TỰ ĐỘNG MỞ TRÌNH DUYỆT
REM -----------------------------------------------------------------------------
echo.
echo [5/5] Hoàn tất khởi động hệ thống!
echo.
echo ===============================================================================
echo                           HỆ THỐNG ĐÃ SẴN SÀNG ĐỂ CHẤM ĐIỂM
echo ===============================================================================
echo  * Ứng dụng Web (Frontend):    http://localhost:5173
echo  * API Máy chủ (Backend):     http://localhost:8000/api
echo  * Máy chủ WebSocket:         http://localhost:5001
echo  * CSDL MariaDB/MySQL:        Port 3306 (Tên CSDL: tdtu_note_app)
echo -------------------------------------------------------------------------------
echo  TÀI KHOẢN MẪU ĐÃ CÓ SẴN DỮ LIỆU ĐỂ TEST 32 TIÊU CHÍ RUBRIC:
echo  1. Tài khoản Owner (Chính):       student1@tdtu.edu.vn  / password123
echo     (Có sẵn note ghim, note khóa pass: note123456, note chia sẻ, nhãn, file)
echo  2. Tài khoản Collaborator:        student2@tdtu.edu.vn  / password123
echo     (Xem mục 'Được chia sẻ' để test sync real-time & con trỏ pointer)
echo  3. Tài khoản chưa kích hoạt:      unverified@tdtu.edu.vn / password123
echo     (Kiểm tra banner cảnh báo kích hoạt tài khoản)
echo -------------------------------------------------------------------------------
echo  * Để dừng toàn bộ hệ thống, bạn có thể chạy file: stop.bat
echo ===============================================================================
echo.
echo Đang mở trình duyệt vào http://localhost:5173 trong 2 giây...
timeout /t 2 /nobreak >nul
start http://localhost:5173
exit /b 0
