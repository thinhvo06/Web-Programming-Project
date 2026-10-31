<?php
require_once __DIR__ . '/../../middleware/auth.php';

$user = require_auth();

// GET: Lấy danh sách nhãn của người dùng
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->prepare("SELECT id, name, created_at, updated_at FROM labels WHERE user_id = ? ORDER BY name ASC");
    $stmt->execute([$user['id']]);
    $labels = $stmt->fetchAll();

    json_response(200, true, 'Danh sách nhãn.', [
        'labels' => $labels
    ]);
}

// POST: Tạo nhãn mới
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = get_json_input();
    $name = trim($input['name'] ?? '');

    if (empty($name)) {
        json_response(400, false, 'Tên nhãn không được để trống.');
    }

    // Kiểm tra trùng tên nhãn
    $stmt = $pdo->prepare("SELECT id FROM labels WHERE user_id = ? AND name = ?");
    $stmt->execute([$user['id'], $name]);
    if ($stmt->fetch()) {
        json_response(409, false, 'Nhãn này đã tồn tại trong danh sách của bạn.');
    }

    $insert = $pdo->prepare("INSERT INTO labels (user_id, name) VALUES (?, ?)");
    $insert->execute([$user['id'], $name]);
    $label_id = $pdo->lastInsertId();

    json_response(201, true, 'Tạo nhãn mới thành công!', [
        'label' => [
            'id' => (int)$label_id,
            'name' => $name
        ]
    ]);
}

json_response(405, false, 'Phương thức không được hỗ trợ.');
