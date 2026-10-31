<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/notes_helper.php';

$user = require_auth();
$note_id = isset($_GET['noteId']) ? (int)$_GET['noteId'] : 0;

if ($note_id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

// Kiểm tra quyền (owner hoặc shared editor)
$stmt = $pdo->prepare("SELECT * FROM notes WHERE id = ?");
$stmt->execute([$note_id]);
$note = $stmt->fetch();

if (!$note) {
    json_response(404, false, 'Không tìm thấy ghi chú.');
}

$is_owner = ((int)$note['user_id'] === (int)$user['id']);
$shares = get_note_shares($pdo, $note_id);
$can_edit = $is_owner;
foreach ($shares as $s) {
    if ((int)$s['recipient']['id'] === (int)$user['id'] && $s['permission'] === 'edit') {
        $can_edit = true;
        break;
    }
}

if (!$can_edit) {
    json_response(403, false, 'Bạn không có quyền đính kèm tệp vào ghi chú này.');
}

if (!isset($_FILES['files']) || empty($_FILES['files']['name'])) {
    json_response(400, false, 'Không có tệp nào được tải lên.');
}

$upload_dir = __DIR__ . '/../../uploads/attachments';
if (!is_dir($upload_dir)) {
    @mkdir($upload_dir, 0777, true);
}

// Hàm phân loại file_type ('image', 'video', 'file')
function get_file_type($mime) {
    if (strpos($mime, 'image/') === 0) return 'image';
    if (strpos($mime, 'video/') === 0) return 'video';
    return 'file';
}

$uploaded_files = [];
$files = $_FILES['files'];

// Chuẩn hóa mảng $_FILES khi upload nhiều file
$count = is_array($files['name']) ? count($files['name']) : 1;

for ($i = 0; $i < $count; $i++) {
    $error = is_array($files['error']) ? $files['error'][$i] : $files['error'];
    if ($error !== UPLOAD_ERR_OK) continue;

    $orig_name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
    $tmp_name = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
    $size = is_array($files['size']) ? $files['size'][$i] : $files['size'];

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $tmp_name);
    finfo_close($finfo);

    $file_type = get_file_type($mime);
    $ext = pathinfo($orig_name, PATHINFO_EXTENSION);
    $stored_filename = 'attach-' . time() . '-' . rand(1000, 9999) . ($ext ? '.' . $ext : '');
    $target_path = $upload_dir . '/' . $stored_filename;

    if (move_uploaded_file($tmp_name, $target_path)) {
        $rel_path = '/uploads/attachments/' . $stored_filename;

        $ins = $pdo->prepare("INSERT INTO attachments (note_id, file_name, original_name, file_type, mime_type, file_size, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $ins->execute([$note_id, $stored_filename, $orig_name, $file_type, $mime, $size, $rel_path]);
        $attach_id = $pdo->lastInsertId();

        $uploaded_files[] = [
            'id' => (int)$attach_id,
            'note_id' => (int)$note_id,
            'file_name' => $stored_filename,
            'original_name' => $orig_name,
            'file_type' => $file_type,
            'mime_type' => $mime,
            'file_size' => (int)$size,
            'file_path' => $rel_path
        ];
    }
}

json_response(201, true, 'Đã tải lên thành công ' . count($uploaded_files) . ' tệp đính kèm!', [
    'attachments' => $uploaded_files
]);
