<?php
/**
 * Helper chuẩn hóa phản hồi JSON và cấu hình CORS cho API
 */

// Bật CORS cho tất cả các request
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Xử lý preflight request OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Trả về phản hồi JSON chuẩn
 */
function json_response($status_code, $success, $message, $data = []) {
    http_response_code($status_code);
    $response = [
        'success' => $success,
        'message' => $message
    ];
    if (!empty($data)) {
        $response = array_merge($response, $data);
    }
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Lấy dữ liệu JSON từ Request Body
 */
function get_json_input() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
