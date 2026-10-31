<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

$input = get_json_input();
$current_password = $input['current_password'] ?? '';

if (empty($current_password)) {
    json_response(400, false, 'Vui lòng nhập mật khẩu hiện tại của ghi chú để hủy bảo vệ.');
}

$stmt = $pdo->prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user['id']]);
$note = $stmt->fetch();

if (!$note) {
    json_response(404, false, 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.');
}

if (!$note['is_locked'] || empty($note['password_hash'])) {
    json_response(400, false, 'Ghi chú này hiện không được cài mật khẩu.');
}

if (!password_verify($current_password, $note['password_hash'])) {
    json_response(400, false, 'Mật khẩu ghi chú không chính xác. Không thể hủy bảo vệ.');
}

$update = $pdo->prepare("UPDATE notes SET is_locked = 0, password_hash = NULL WHERE id = ?");
$update->execute([$id]);

json_response(200, true, 'Đã hủy bảo vệ mật khẩu ghi chú thành công!', [
    'is_locked' => false
]);
