<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

$input = get_json_input();
$password = $input['password'] ?? '';
$confirm_password = $input['confirm_password'] ?? '';

if (empty($password)) {
    json_response(400, false, 'Vui lòng nhập mật khẩu để khóa ghi chú.');
}

if (!empty($confirm_password) && $password !== $confirm_password) {
    json_response(400, false, 'Mật khẩu xác nhận không khớp.');
}

$stmt = $pdo->prepare("SELECT id FROM notes WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user['id']]);
if (!$stmt->fetch()) {
    json_response(404, false, 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.');
}

$hash = password_hash($password, PASSWORD_BCRYPT);
$update = $pdo->prepare("UPDATE notes SET is_locked = 1, password_hash = ? WHERE id = ?");
$update->execute([$hash, $id]);

json_response(200, true, 'Đã bật bảo vệ mật khẩu cho ghi chú thành công!', [
    'is_locked' => true
]);
