<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();
$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($id <= 0) {
    json_response(400, false, 'ID nhãn không hợp lệ.');
}

$stmt = $pdo->prepare("SELECT * FROM labels WHERE id = ? AND user_id = ?");
$stmt->execute([$id, $user['id']]);
$label = $stmt->fetch();

if (!$label) {
    json_response(404, false, 'Không tìm thấy nhãn.');
}

// PUT: Đổi tên nhãn
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = get_json_input();
    $name = trim($input['name'] ?? '');

    if (empty($name)) {
        json_response(400, false, 'Tên nhãn mới không được để trống.');
    }

    $update = $pdo->prepare("UPDATE labels SET name = ?, updated_at = NOW() WHERE id = ?");
    $update->execute([$name, $id]);

    json_response(200, true, 'Đổi tên nhãn thành công! Mọi ghi chú liên quan đã được tự động cập nhật.', [
        'label' => [
            'id' => (int)$id,
            'name' => $name
        ]
    ]);
}

// DELETE: Xóa nhãn (Lưu ý: Xóa nhãn KHÔNG mất note - Tiêu chí 20 & Oral Exam Q3)
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    // 1. Xóa các bản ghi liên kết trong bảng note_labels
    $del_rel = $pdo->prepare("DELETE FROM note_labels WHERE label_id = ?");
    $del_rel->execute([$id]);

    // 2. Xóa nhãn khỏi bảng labels
    $del_label = $pdo->prepare("DELETE FROM labels WHERE id = ?");
    $del_label->execute([$id]);

    json_response(200, true, 'Xóa nhãn thành công! Các ghi chú vẫn được giữ nguyên vẹn.');
}

json_response(405, false, 'Phương thức không được hỗ trợ.');
