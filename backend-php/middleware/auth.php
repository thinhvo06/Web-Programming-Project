<?php
/**
 * Middleware Xác thực Người dùng qua JWT Token (Header Authorization)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../helpers/jwt.php';

function get_auth_header() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    return $headers;
}

function require_auth() {
    global $pdo, $jwt_secret;

    $auth_header = get_auth_header();
    if (!$auth_header || !preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
        json_response(401, false, 'Yêu cầu đăng nhập. Không tìm thấy token xác thực.');
    }

    $jwt = $matches[1];
    $payload = verify_jwt($jwt, $jwt_secret);

    if (!$payload || !isset($payload['id'])) {
        json_response(401, false, 'Token xác thực không hợp lệ hoặc đã hết hạn.');
    }

    $stmt = $pdo->prepare("SELECT id, email, display_name, avatar_url, is_activated, preferences FROM users WHERE id = ?");
    $stmt->execute([$payload['id']]);
    $user = $stmt->fetch();

    if (!$user) {
        json_response(401, false, 'Người dùng không tồn tại hoặc tài khoản đã bị khóa.');
    }

    $user['preferences'] = !empty($user['preferences']) ? json_decode($user['preferences'], true) : [
        'fontSize' => 'medium',
        'noteColor' => 'default',
        'theme' => 'light'
    ];

    return $user;
}
