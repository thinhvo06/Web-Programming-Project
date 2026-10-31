<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/notes_helper.php';

$user = require_auth();

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
    json_response(400, false, 'ID ghi chú không hợp lệ.');
}

// Lấy thông tin note
$stmt = $pdo->prepare("SELECT * FROM notes WHERE id = ?");
$stmt->execute([$id]);
$note = $stmt->fetch();

if (!$note) {
    json_response(404, false, 'Không tìm thấy ghi chú.');
}

// Kiểm tra quyền xem / sửa
$is_owner = ((int)$note['user_id'] === (int)$user['id']);
$shares = get_note_shares($pdo, $note['id']);

$is_shared_to_user = false;
$user_permission = 'none';
foreach ($shares as $s) {
    if ((int)$s['recipient']['id'] === (int)$user['id']) {
        $is_shared_to_user = true;
        $user_permission = $s['permission'];
        break;
    }
}

if (!$is_owner && !$is_shared_to_user) {
    json_response(403, false, 'Bạn không có quyền truy cập ghi chú này.');
}

// GET: Xem chi tiết
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $password = $_GET['password'] ?? '';
    $is_unlocked = false;

    if ($note['is_locked']) {
        if (!empty($password) && !empty($note['password_hash'])) {
            $is_unlocked = password_verify($password, $note['password_hash']);
        }
    } else {
        $is_unlocked = true;
    }

    $note['labels'] = get_note_labels($pdo, $note['id']);
    $note['attachments'] = get_note_attachments($pdo, $note['id']);
    $note['shares'] = $shares;

    json_response(200, true, 'Chi tiết ghi chú.', [
        'note' => format_note_response($note, $user['id'], $is_unlocked)
    ]);
}

// PUT / PATCH: Sửa note (Dùng cho Auto-save)
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || $_SERVER['REQUEST_METHOD'] === 'PATCH') {
    $can_edit = $is_owner || ($is_shared_to_user && $user_permission === 'edit');
    if (!$can_edit) {
        json_response(403, false, 'Bạn chỉ có quyền xem (Read-only), không thể chỉnh sửa ghi chú này.');
    }

    $input = get_json_input();
    $title = isset($input['title']) ? trim($input['title']) : $note['title'];
    $content = isset($input['content']) ? $input['content'] : $note['content'];
    $color = isset($input['color']) ? $input['color'] : $note['color'];

    $is_pinned = $note['is_pinned'];
    $pinned_at = $note['pinned_at'];
    if ($is_owner && isset($input['is_pinned'])) {
        $new_pin = !empty($input['is_pinned']) ? 1 : 0;
        if ($new_pin != $note['is_pinned']) {
            $is_pinned = $new_pin;
            $pinned_at = $new_pin ? date('Y-m-d H:i:s') : null;
        }
    }

    $update = $pdo->prepare("UPDATE notes SET title = ?, content = ?, color = ?, is_pinned = ?, pinned_at = ?, updated_at = NOW() WHERE id = ?");
    $update->execute([$title, $content, $color, $is_pinned, $pinned_at, $id]);

    // Cập nhật nhãn nếu là owner
    if ($is_owner && isset($input['label_ids']) && is_array($input['label_ids'])) {
        $del = $pdo->prepare("DELETE FROM note_labels WHERE note_id = ?");
        $del->execute([$id]);

        $ins = $pdo->prepare("INSERT INTO note_labels (note_id, label_id) VALUES (?, ?)");
        foreach ($input['label_ids'] as $lid) {
            $ins->execute([$id, (int)$lid]);
        }
    }

    // Lấy lại dữ liệu note đã cập nhật
    $stmt_reload = $pdo->prepare("SELECT * FROM notes WHERE id = ?");
    $stmt_reload->execute([$id]);
    $updated = $stmt_reload->fetch();
    $updated['labels'] = get_note_labels($pdo, $id);
    $updated['attachments'] = get_note_attachments($pdo, $id);
    $updated['shares'] = get_note_shares($pdo, $id);

    json_response(200, true, 'Cập nhật ghi chú thành công (Auto-save)!', [
        'note' => format_note_response($updated, $user['id'], true)
    ]);
}

// DELETE: Xóa ghi chú
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!$is_owner) {
        json_response(403, false, 'Chỉ chủ sở hữu mới có quyền xóa ghi chú này.');
    }

    $input = get_json_input();
    $password = $input['password'] ?? ($_GET['password'] ?? '');

    // Nếu note bị khóa, kiểm tra password
    if ($note['is_locked'] && !empty($note['password_hash'])) {
        if (empty($password)) {
            json_response(400, false, 'Ghi chú này đã được khóa. Vui lòng nhập mật khẩu ghi chú để xác nhận xóa.');
        }
        if (!password_verify($password, $note['password_hash'])) {
            json_response(400, false, 'Mật khẩu ghi chú không chính xác. Không thể xóa ghi chú.');
        }
    }

    $del = $pdo->prepare("DELETE FROM notes WHERE id = ?");
    $del->execute([$id]);

    json_response(200, true, 'Xóa ghi chú thành công!');
}

json_response(405, false, 'Phương thức không được hỗ trợ.');
