<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/notes_helper.php';

$user = require_auth();
$note_id = isset($_GET['noteId']) ? (int)$_GET['noteId'] : 0;

if ($note_id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

// Kiểm tra quyền sở hữu note
$stmt = $pdo->prepare("SELECT id FROM notes WHERE id = ? AND user_id = ?");
$stmt->execute([$note_id, $user['id']]);
if (!$stmt->fetch()) {
    json_response(404, false, 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.');
}

$shares = get_note_shares($pdo, $note_id);

json_response(200, true, 'Danh sách người được chia sẻ.', [
    'shares' => $shares
]);
