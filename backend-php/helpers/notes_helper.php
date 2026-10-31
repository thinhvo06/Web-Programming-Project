<?php
/**
 * Helper định dạng ghi chú và tải kèm nhãn, file đính kèm, chia sẻ
 */

function get_note_attachments($pdo, $note_id) {
    $stmt = $pdo->prepare("SELECT id, file_name, original_name, file_type, mime_type, file_size, file_path FROM attachments WHERE note_id = ?");
    $stmt->execute([$note_id]);
    return $stmt->fetchAll();
}

function get_note_labels($pdo, $note_id) {
    $stmt = $pdo->prepare("SELECT l.id, l.name FROM labels l JOIN note_labels nl ON l.id = nl.label_id WHERE nl.note_id = ?");
    $stmt->execute([$note_id]);
    return $stmt->fetchAll();
}

function get_note_shares($pdo, $note_id) {
    $stmt = $pdo->prepare("SELECT s.id, s.permission, s.created_at, u.id as user_id, u.email, u.display_name, u.avatar_url FROM note_shares s JOIN users u ON s.shared_with_user_id = u.id WHERE s.note_id = ?");
    $stmt->execute([$note_id]);
    $shares = $stmt->fetchAll();
    $result = [];
    foreach ($shares as $s) {
        $result[] = [
            'id' => (int)$s['id'],
            'permission' => $s['permission'],
            'shared_at' => $s['created_at'],
            'recipient' => [
                'id' => (int)$s['user_id'],
                'email' => $s['email'],
                'display_name' => $s['display_name'],
                'avatar_url' => $s['avatar_url'] ?: '/public/default-avatar.svg'
            ]
        ];
    }
    return $result;
}

function format_note_response($note, $current_user_id, $unlocked = false) {
    $is_owner = ((int)$note['user_id'] === (int)$current_user_id);
    $is_locked = (bool)$note['is_locked'];
    $is_unlocked = (!$is_locked || $unlocked);

    $safe_content = $note['content'];
    if ($is_locked && !$is_unlocked) {
        $safe_content = '🔒 Ghi chú đã được bảo vệ bằng mật khẩu.';
    }

    $shares = $note['shares'] ?? [];
    $is_shared = !empty($shares) || !$is_owner;

    $user_role = $is_owner ? 'owner' : 'read';
    if (!$is_owner && !empty($shares)) {
        foreach ($shares as $s) {
            if (isset($s['recipient']['id']) && (int)$s['recipient']['id'] === (int)$current_user_id) {
                $user_role = $s['permission'];
                break;
            }
        }
    }

    return [
        'id' => (int)$note['id'],
        'user_id' => (int)$note['user_id'],
        'title' => $note['title'],
        'content' => $safe_content,
        'color' => $note['color'] ?: 'default',
        'is_pinned' => (bool)$note['is_pinned'],
        'pinned_at' => $note['pinned_at'],
        'is_locked' => $is_locked,
        'is_unlocked' => $is_unlocked,
        'is_shared' => $is_shared,
        'user_role' => $user_role,
        'labels' => $note['labels'] ?? [],
        'attachments' => $note['attachments'] ?? [],
        'shares' => $shares,
        'created_at' => $note['created_at'],
        'updated_at' => $note['updated_at']
    ];
}
