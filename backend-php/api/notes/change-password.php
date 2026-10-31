<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

$input = get_json_input();
$current_password = $input['current_password'] ?? '';
$new_password = $input['new_password'] ?? '';
$confirm_password = $input['confirm_password'] ?? '';

if (empty($current_password) || empty($new_password)) {
    json_response(400, false, 'Vui lòng nhập mật khẩu cũ và mật khẩu mới.');
}

if (!empty($confirm_password) && $new_password !== $confirm_password) {
    json_response(400, false, 'Mật khẩu mới xác nhận không khớp.');
}

$stmt = $pdo->prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user['id']]);
$note = $stmt->fetch();

if (!$note) {
    json_response(404, false, 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.');
}

if (!$note['is_locked'] || empty($note['password_hash'])) {
    json_response(400, false, 'Ghi chú này chưa được cài mật khẩu.');
}

if (!password_verify($current_password, $note['password_hash'])) {
    json_response(400, false, 'Mật khẩu hiện tại của ghi chú không chính xác.');
}

$new_hash = password_hash($new_password, PASSWORD_BCRYPT);
$update = $pdo->prepare("UPDATE notes SET password_hash = ? WHERE id = ?");
$update->execute([$new_hash, $id]);

json_response(200, true, 'Đổi mật khẩu ghi chú thành công!');
