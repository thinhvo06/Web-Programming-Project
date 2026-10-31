<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/jwt.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

$input = get_json_input();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    json_response(400, false, 'Vui lòng cung cấp email và mật khẩu.');
}

$stmt = $pdo->prepare("SELECT id, email, password, display_name, avatar_url, is_activated, preferences FROM users WHERE email = ?");
$stmt->execute([strtolower($email)]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    json_response(401, false, 'Email hoặc mật khẩu không chính xác.');
}

// Cấp token JWT
$token = generate_jwt([
    'id' => $user['id'],
    'email' => $user['email'],
    'display_name' => $user['display_name']
], $jwt_secret);

$preferences = !empty($user['preferences']) ? json_decode($user['preferences'], true) : [
    'fontSize' => 'medium',
    'noteColor' => 'default',
    'theme' => 'light'
];

json_response(200, true, 'Đăng nhập thành công.', [
    'token' => $token,
    'user' => [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'display_name' => $user['display_name'],
        'avatar_url' => $user['avatar_url'] ?: '/public/default-avatar.svg',
        'is_activated' => (bool)$user['is_activated'],
        'preferences' => $preferences
    ]
]);
