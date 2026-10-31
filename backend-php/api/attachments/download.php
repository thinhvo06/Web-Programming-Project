<?php
require_once __DIR__ . '/../../config/database.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    http_response_code(400);
    echo "ID tệp không hợp lệ.";
    exit;
}

$stmt = $pdo->prepare("SELECT * FROM attachments WHERE id = ?");
$stmt->execute([$id]);
$attach = $stmt->fetch();

if (!$attach) {
    http_response_code(404);
    echo "Không tìm thấy tệp đính kèm.";
    exit;
}

$file_path = __DIR__ . '/../../uploads/attachments/' . $attach['file_name'];
if (!file_exists($file_path)) {
    http_response_code(404);
    echo "Tệp tin không còn tồn tại trên máy chủ.";
    exit;
}

header('Content-Description: File Transfer');
header('Content-Type: ' . $attach['mime_type']);
header('Content-Disposition: attachment; filename="' . basename($attach['original_name']) . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($file_path));
readfile($file_path);
exit;
