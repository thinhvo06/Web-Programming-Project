<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response(200, true, 'Thông tin người dùng.', [
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'display_name' => $user['display_name'],
            'avatar_url' => $user['avatar_url'] ?: '/public/default-avatar.svg',
            'is_activated' => (bool)$user['is_activated'],
            'preferences' => $user['preferences']
        ]
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $display_name = trim($_POST['display_name'] ?? '');
    $avatar_url = $user['avatar_url'];

    // Xử lý upload avatar nếu có
    if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['avatar'];
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mime_type, $allowed_types)) {
            json_response(400, false, 'Chỉ hỗ trợ file ảnh định dạng JPEG, PNG, GIF hoặc WEBP.');
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            json_response(400, false, 'Kích thước ảnh đại diện không được vượt quá 5MB.');
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'avatar-' . $user['id'] . '-' . time() . '-' . rand(1000, 9999) . '.' . $ext;
        $target_dir = __DIR__ . '/../../uploads/avatars';
        if (!is_dir($target_dir)) {
            @mkdir($target_dir, 0777, true);
        }
        $target_path = $target_dir . '/' . $filename;

        if (move_uploaded_file($file['tmp_name'], $target_path)) {
            $avatar_url = '/uploads/avatars/' . $filename;
        }
    }

    $new_name = !empty($display_name) ? $display_name : $user['display_name'];

    $update = $pdo->prepare("UPDATE users SET display_name = ?, avatar_url = ? WHERE id = ?");
    $update->execute([$new_name, $avatar_url, $user['id']]);

    json_response(200, true, 'Cập nhật thông tin cá nhân thành công!', [
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'display_name' => $new_name,
            'avatar_url' => $avatar_url ?: '/public/default-avatar.svg',
            'is_activated' => (bool)$user['is_activated'],
            'preferences' => $user['preferences']
        ]
    ]);
}

json_response(405, false, 'Phương thức không được hỗ trợ.');
