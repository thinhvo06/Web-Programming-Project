<?php
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/notes_helper.php';

$user = require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

$sql = "SELECT s.id as share_id, s.permission, s.created_at as shared_at, 
               n.*, 
               u.id as owner_id, u.email as owner_email, u.display_name as owner_name, u.avatar_url as owner_avatar
        FROM note_shares s
        JOIN notes n ON s.note_id = n.id
        JOIN users u ON n.user_id = u.id
        WHERE s.shared_with_user_id = ?
        ORDER BY s.created_at DESC";

$stmt = $pdo->prepare($sql);
$stmt->execute([$user['id']]);
$rows = $stmt->fetchAll();

$shared_notes = [];
foreach ($rows as $r) {
    $note_id = $r['id'];
    $labels = get_note_labels($pdo, $note_id);
    $attachments = get_note_attachments($pdo, $note_id);

    $shared_notes[] = [
        'id' => (int)$note_id,
        'user_id' => (int)$r['user_id'],
        'title' => $r['title'],
        'content' => $r['content'],
        'color' => $r['color'] ?: 'default',
        'is_pinned' => (bool)$r['is_pinned'],
        'is_locked' => (bool)$r['is_locked'],
        'is_shared' => true,
        'user_role' => $r['permission'], // 'read' hoặc 'edit'
        'labels' => $labels,
        'attachments' => $attachments,
        'shared_info' => [
            'share_id' => (int)$r['share_id'],
            'permission' => $r['permission'],
            'shared_at' => $r['shared_at'],
            'shared_by' => [
                'id' => (int)$r['owner_id'],
                'email' => $r['owner_email'],
                'display_name' => $r['owner_name'],
                'avatar_url' => $r['owner_avatar'] ?: '/public/default-avatar.svg'
            ]
        ],
        'created_at' => $r['created_at'],
        'updated_at' => $r['updated_at']
    ];
}

json_response(200, true, 'Danh sách ghi chú được chia sẻ với bạn.', [
    'total' => count($shared_notes),
    'notes' => $shared_notes
]);
