<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    json_response(400, false, 'Thiếu mã kích hoạt tài khoản.');
}

$stmt = $pdo->prepare("SELECT id, email, display_name FROM users WHERE activation_token = ?");
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) {
    json_response(400, false, 'Mã kích hoạt không hợp lệ hoặc tài khoản đã được kích hoạt trước đó.');
}

$update = $pdo->prepare("UPDATE users SET is_activated = 1, activation_token = NULL WHERE id = ?");
$update->execute([$user['id']]);

json_response(200, true, 'Tài khoản đã được kích hoạt thành công! Banner cảnh báo sẽ biến mất.', [
    'user' => [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'display_name' => $user['display_name'],
        'is_activated' => true
    ]
]);
