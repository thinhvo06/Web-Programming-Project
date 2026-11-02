<?php
/**
 * Kết nối Cơ sở Dữ liệu MySQL bằng PDO
 * Môn: 503073 - Lập trình & Ứng dụng Web (TDTU)
 */

$db_host = '127.0.0.1';
$db_port = '3306';
$db_name = 'tdtu_note_app';
$db_user = 'root';
$db_pass = ''; // Mặc định trên XAMPP mật khẩu root là rỗng

$jwt_secret = 'tdtu_web_programming_final_project_jwt_secret_key_2026';
$base_url = 'http://localhost:8000';
$frontend_url = 'http://localhost:5173';

try {
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    // Trả về lỗi nếu không kết nối được DB (kèm CORS header để trình duyệt không bị lỗi Failed to fetch)
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
    header('Content-Type: application/json; charset=UTF-8');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Lỗi kết nối cơ sở dữ liệu MySQL: ' . $e->getMessage() . '. Hãy chắc chắn đã bật MySQL trong XAMPP và import file database.sql!'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
