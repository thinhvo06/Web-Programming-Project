<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

$stmt = $pdo->prepare("SELECT id, is_pinned FROM notes WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user['id']]);
$note = $stmt->fetch();

if (!$note) {
    json_response(404, false, 'Không tìm thấy ghi chú của bạn.');
}

$new_pin = $note['is_pinned'] ? 0 : 1;
$pinned_at = $new_pin ? date('Y-m-d H:i:s') : null;

$update = $pdo->prepare("UPDATE notes SET is_pinned = ?, pinned_at = ? WHERE id = ?");
$update->execute([$new_pin, $pinned_at, $id]);

json_response(200, true, $new_pin ? 'Đã ghim ghi chú lên đầu!' : 'Đã bỏ ghim ghi chú.', [
    'is_pinned' => (bool)$new_pin,
    'pinned_at' => $pinned_at
]);
