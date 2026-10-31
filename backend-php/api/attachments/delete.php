<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/notes_helper.php';

$user = require_auth();
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    json_response(400, false, 'ID tệp không hợp lệ.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

$stmt = $pdo->prepare("SELECT a.*, n.user_id as owner_id FROM attachments a JOIN notes n ON a.note_id = n.id WHERE a.id = ?");
$stmt->execute([$id]);
$attach = $stmt->fetch();

if (!$attach) {
    json_response(404, false, 'Không tìm thấy tệp đính kèm cần xóa.');
}

$is_owner = ((int)$attach['owner_id'] === (int)$user['id']);
$shares = get_note_shares($pdo, $attach['note_id']);
$can_edit = $is_owner;
foreach ($shares as $s) {
    if ((int)$s['recipient']['id'] === (int)$user['id'] && $s['permission'] === 'edit') {
        $can_edit = true;
        break;
    }
}

if (!$can_edit) {
    json_response(403, false, 'Bạn không có quyền xóa tệp đính kèm này.');
}

// Xóa file vật lý
$file_path = __DIR__ . '/../../uploads/attachments/' . $attach['file_name'];
if (file_exists($file_path)) {
    @unlink($file_path);
}

// Xóa trong DB
$del = $pdo->prepare("DELETE FROM attachments WHERE id = ?");
$del->execute([$id]);

json_response(200, true, 'Đã xóa tệp đính kèm thành công!');
