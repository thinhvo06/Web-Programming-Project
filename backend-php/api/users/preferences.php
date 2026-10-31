<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_response(200, true, 'Cài đặt người dùng.', [
        'preferences' => $user['preferences']
    ]);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' || $_SERVER['REQUEST_METHOD'] === 'PUT') {
    $input = get_json_input();
    $current = $user['preferences'];

    $updated = [
        'fontSize' => $input['fontSize'] ?? ($current['fontSize'] ?? 'medium'),
        'noteColor' => $input['noteColor'] ?? ($current['noteColor'] ?? 'default'),
        'theme' => $input['theme'] ?? ($current['theme'] ?? 'light')
    ];

    $json_prefs = json_encode($updated);
    $update = $pdo->prepare("UPDATE users SET preferences = ? WHERE id = ?");
    $update->execute([$json_prefs, $user['id']]);

    json_response(200, true, 'Cập nhật tùy biến người dùng thành công!', [
        'preferences' => $updated
    ]);
}

json_response(405, false, 'Phương thức không được hỗ trợ.');
