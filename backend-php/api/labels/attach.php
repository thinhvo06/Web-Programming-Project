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
    json_response(404, false, 'Không tìm thấy ghi chú hoặc bạn không có quyền sửa nhãn.');
}

$input = get_json_input();
$label_ids = $input['label_ids'] ?? [];

if (!is_array($label_ids)) {
    json_response(400, false, 'label_ids phải là một danh sách ID nhãn.');
}

// Xóa các nhãn cũ
$del = $pdo->prepare("DELETE FROM note_labels WHERE note_id = ?");
$del->execute([$note_id]);

// Gắn nhãn mới
$ins = $pdo->prepare("INSERT INTO note_labels (note_id, label_id) VALUES (?, ?)");
foreach ($label_ids as $lid) {
    $ins->execute([$note_id, (int)$lid]);
}

$updated_labels = get_note_labels($pdo, $note_id);

json_response(200, true, 'Cập nhật nhãn cho ghi chú thành công!', [
    'labels' => $updated_labels
]);
