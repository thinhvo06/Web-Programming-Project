<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

$input = get_json_input();
$current_password = $input['current_password'] ?? '';
$new_password = $input['new_password'] ?? '';
$confirm_password = $input['confirm_password'] ?? '';

if (empty($current_password) || empty($new_password)) {
    json_response(400, false, 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới.');
}

if (!empty($confirm_password) && $new_password !== $confirm_password) {
    json_response(400, false, 'Mật khẩu xác nhận không khớp.');
}

if (strlen($new_password) < 6) {
    json_response(400, false, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
}

// Lấy pass hash hiện tại từ DB
$stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
$stmt->execute([$user['id']]);
$user_db = $stmt->fetch();

if (!$user_db || !password_verify($current_password, $user_db['password'])) {
    json_response(400, false, 'Mật khẩu hiện tại không chính xác.');
}

$new_hash = password_hash($new_password, PASSWORD_BCRYPT);
$update = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
$update->execute([$new_hash, $user['id']]);

json_response(200, true, 'Đổi mật khẩu thành công!');
