<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/notes_helper.php';

$user = require_auth();

// GET: Lấy danh sách ghi chú (hỗ trợ search và labelId)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $label_id = isset($_GET['labelId']) ? (int)$_GET['labelId'] : 0;

    $sql = "SELECT DISTINCT n.* FROM notes n ";
    $params = [];

    if ($label_id > 0) {
        $sql .= "JOIN note_labels nl ON n.id = nl.note_id WHERE nl.label_id = ? AND n.user_id = ? ";
        $params[] = $label_id;
        $params[] = $user['id'];
    } else {
        $sql .= "WHERE n.user_id = ? ";
        $params[] = $user['id'];
    }

    if (!empty($search)) {
        $sql .= "AND (n.title LIKE ? OR n.content LIKE ?) ";
        $params[] = "%{$search}%";
        $params[] = "%{$search}%";
    }

    // Ghim lên đầu sắp xếp theo pinned_at DESC, sau đó updated_at DESC
    $sql .= "ORDER BY n.is_pinned DESC, n.pinned_at DESC, n.updated_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $notes = $stmt->fetchAll();

    $formatted = [];
    foreach ($notes as $n) {
        $n['labels'] = get_note_labels($pdo, $n['id']);
        $n['attachments'] = get_note_attachments($pdo, $n['id']);
        $n['shares'] = get_note_shares($pdo, $n['id']);
        $formatted[] = format_note_response($n, $user['id']);
    }

    json_response(200, true, 'Danh sách ghi chú.', [
        'total' => count($formatted),
        'notes' => $formatted
    ]);
}

// POST: Tạo ghi chú mới
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = get_json_input();
    $title = trim($input['title'] ?? '');
    $content = trim($input['content'] ?? '');
    $is_pinned = !empty($input['is_pinned']) ? 1 : 0;
    $color = $input['color'] ?? 'default';
    $label_ids = $input['label_ids'] ?? [];

    if (empty($title) && empty($content)) {
        json_response(400, false, 'Vui lòng nhập ít nhất Tiêu đề hoặc Nội dung ghi chú.');
    }
    if (empty($title)) {
        $title = 'Ghi chú không tiêu đề';
    }

    $pinned_at = $is_pinned ? date('Y-m-d H:i:s') : null;

    $stmt = $pdo->prepare("INSERT INTO notes (user_id, title, content, is_pinned, pinned_at, color, is_locked) VALUES (?, ?, ?, ?, ?, ?, 0)");
    $stmt->execute([$user['id'], $title, $content, $is_pinned, $pinned_at, $color]);
    $note_id = $pdo->lastInsertId();

    // Gắn nhãn nếu có (hỗ trợ cả label_ids và tên nhãn trong mảng labels)
    $final_label_ids = $label_ids;
    if (empty($final_label_ids) && !empty($input['labels']) && is_array($input['labels'])) {
        foreach ($input['labels'] as $lbl) {
            if (is_numeric($lbl)) {
                $final_label_ids[] = (int)$lbl;
            } elseif (is_string($lbl) && trim($lbl) !== '') {
                $lbl_name = trim($lbl);
                $stmt_find = $pdo->prepare("SELECT id FROM labels WHERE user_id = ? AND name = ?");
                $stmt_find->execute([$user['id'], $lbl_name]);
                $lid = $stmt_find->fetchColumn();
                if (!$lid) {
                    $stmt_ins = $pdo->prepare("INSERT INTO labels (user_id, name) VALUES (?, ?)");
                    $stmt_ins->execute([$user['id'], $lbl_name]);
                    $lid = $pdo->lastInsertId();
                }
                $final_label_ids[] = (int)$lid;
            }
        }
    }

    if (!empty($final_label_ids)) {
        $stmt_label = $pdo->prepare("INSERT INTO note_labels (note_id, label_id) VALUES (?, ?)");
        foreach ($final_label_ids as $lid) {
            $stmt_label->execute([$note_id, (int)$lid]);
        }
    }

    // Lấy lại dữ liệu note vừa tạo
    $stmt_get = $pdo->prepare("SELECT * FROM notes WHERE id = ?");
    $stmt_get->execute([$note_id]);
    $created_note = $stmt_get->fetch();
    $created_note['labels'] = get_note_labels($pdo, $note_id);
    $created_note['attachments'] = [];
    $created_note['shares'] = [];

    json_response(201, true, 'Tạo ghi chú thành công!', [
        'note' => format_note_response($created_note, $user['id'], true)
    ]);
}

json_response(405, false, 'Phương thức không được hỗ trợ.');
