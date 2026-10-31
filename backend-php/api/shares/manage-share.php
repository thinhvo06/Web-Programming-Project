<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();
$share_id = isset($_GET['shareId']) ? (int)$_GET['shareId'] : 0;

if ($share_id <= 0) {
    json_response(400, false, 'ID lượt chia sẻ không hợp lệ.');
}

// Kiểm tra quyền sở hữu của note liên quan
$stmt = $pdo->prepare("SELECT s.id, s.note_id, n.user_id as owner_id FROM note_shares s JOIN notes n ON s.note_id = n.id WHERE s.id = ?");
$stmt->execute([$share_id]);
$share = $stmt->fetch();

if (!$share) {
    json_response(404, false, 'Không tìm thấy thông tin chia sẻ.');
}

if ((int)$share['owner_id'] !== (int)$user['id']) {
    json_response(403, false, 'Chỉ chủ sở hữu ghi chú mới có quyền chỉnh sửa hoặc thu hồi chia sẻ.');
}

// PUT: Cập nhật quyền (read <=> edit)
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $input = get_json_input();
    $permission = ($input['permission'] === 'edit') ? 'edit' : 'read';

    $update = $pdo->prepare("UPDATE note_shares SET permission = ?, updated_at = NOW() WHERE id = ?");
    $update->execute([$permission, $share_id]);

    json_response(200, true, "Đã cập nhật quyền thành " . ($permission === 'edit' ? 'Chỉnh sửa' : 'Chỉ xem') . "!", [
        'share' => [
            'id' => $share_id,
            'permission' => $permission
        ]
    ]);
}

// DELETE: Thu hồi chia sẻ
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $del = $pdo->prepare("DELETE FROM note_shares WHERE id = ?");
    $del->execute([$share_id]);

    json_response(200, true, 'Đã thu hồi quyền chia sẻ ghi chú thành công!');
}

json_response(405, false, 'Phương thức không được hỗ trợ.');
