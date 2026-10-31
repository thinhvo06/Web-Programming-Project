<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/notes_helper.php';

$user = require_auth();
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

$input = get_json_input();
$password = $input['password'] ?? '';

if (empty($password)) {
    json_response(400, false, 'Vui lòng nhập mật khẩu của ghi chú.');
}

$stmt = $pdo->prepare("SELECT * FROM notes WHERE id = ?");
$stmt->execute([$id]);
$note = $stmt->fetch();

if (!$note) {
    json_response(404, false, 'Không tìm thấy ghi chú.');
}

// Kiểm tra quyền truy cập (owner hoặc shared)
$shares = get_note_shares($pdo, $id);
$is_owner = ((int)$note['user_id'] === (int)$user['id']);
$is_shared = false;
foreach ($shares as $s) {
    if ((int)$s['recipient']['id'] === (int)$user['id']) {
        $is_shared = true;
        break;
    }
}

if (!$is_owner && !$is_shared) {
    json_response(403, false, 'Bạn không có quyền truy cập ghi chú này.');
}

if (!$note['is_locked'] || empty($note['password_hash'])) {
    $note['labels'] = get_note_labels($pdo, $id);
    $note['attachments'] = get_note_attachments($pdo, $id);
    $note['shares'] = $shares;
    json_response(200, true, 'Ghi chú này không bị khóa.', [
        'note' => format_note_response($note, $user['id'], true)
    ]);
}

if (!password_verify($password, $note['password_hash'])) {
    json_response(400, false, 'Mật khẩu ghi chú không chính xác.');
}

$note['labels'] = get_note_labels($pdo, $id);
$note['attachments'] = get_note_attachments($pdo, $id);
$note['shares'] = $shares;

json_response(200, true, 'Mở khóa ghi chú thành công!', [
    'note' => format_note_response($note, $user['id'], true)
]);
