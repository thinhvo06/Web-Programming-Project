<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/mailer.php';

$user = require_auth();
$note_id = isset($_GET['noteId']) ? (int)$_GET['noteId'] : 0;

if ($note_id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

// Kiểm tra quyền sở hữu note
$stmt = $pdo->prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?");
$stmt->execute([$note_id, $user['id']]);
$note = $stmt->fetch();

if (!$note) {
    json_response(404, false, 'Không tìm thấy ghi chú hoặc bạn không phải chủ sở hữu.');
}

$input = get_json_input();
$email = trim($input['email'] ?? '');
$permission = in_array($input['permission'] ?? '', ['read', 'edit']) ? $input['permission'] : 'read';

if (empty($email)) {
    json_response(400, false, 'Vui lòng cung cấp địa chỉ email người nhận.');
}

// Xử lý DELETE: Thu hồi quyền chia sẻ theo email
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $stmt_del = $pdo->prepare("DELETE s FROM note_shares s JOIN users u ON s.shared_with_user_id = u.id WHERE s.note_id = ? AND u.email = ?");
    $stmt_del->execute([$note_id, strtolower($email)]);
    json_response(200, true, "Đã thu hồi quyền chia sẻ cho {$email} thành công!");
}

// Kiểm tra tài khoản người nhận tồn tại
$stmt_rec = $pdo->prepare("SELECT id, email, display_name, avatar_url FROM users WHERE email = ?");
$stmt_rec->execute([strtolower($email)]);
$recipient = $stmt_rec->fetch();

if (!$recipient) {
    json_response(404, false, 'Không tìm thấy tài khoản người dùng với email này trong hệ thống.');
}

if ((int)$recipient['id'] === (int)$user['id']) {
    json_response(400, false, 'Bạn không thể tự chia sẻ ghi chú cho chính mình.');
}

// Kiểm tra đã chia sẻ trước đó chưa
$stmt_check = $pdo->prepare("SELECT id FROM note_shares WHERE note_id = ? AND shared_with_user_id = ?");
$stmt_check->execute([$note_id, $recipient['id']]);
$existing = $stmt_check->fetch();

if ($existing) {
    $update = $pdo->prepare("UPDATE note_shares SET permission = ?, updated_at = NOW() WHERE id = ?");
    $update->execute([$permission, $existing['id']]);
    $share_id = $existing['id'];
} else {
    $insert = $pdo->prepare("INSERT INTO note_shares (note_id, shared_with_user_id, permission) VALUES (?, ?, ?)");
    $insert->execute([$note_id, $recipient['id'], $permission]);
    $share_id = $pdo->lastInsertId();
}

// Gửi email thông báo
send_share_note_mail($recipient['email'], $recipient['display_name'], $user['display_name'], $note['title'], $permission);

json_response(200, true, "Đã chia sẻ ghi chú thành công cho {$recipient['display_name']} ({$recipient['email']}) với quyền " . ($permission === 'edit' ? 'Chỉnh sửa' : 'Chỉ xem') . ".", [
    'share' => [
        'id' => (int)$share_id,
        'note_id' => (int)$note_id,
        'recipient' => [
            'id' => (int)$recipient['id'],
            'email' => $recipient['email'],
            'display_name' => $recipient['display_name'],
            'avatar_url' => $recipient['avatar_url'] ?: '/public/default-avatar.svg'
        ],
        'permission' => $permission,
        'shared_at' => date('Y-m-d H:i:s')
    ]
]);
