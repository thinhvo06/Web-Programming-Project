<?php
require_once __DIR__ . '/helpers/response.php';

json_response(200, true, 'TDTU Note App - Pure PHP RESTful Backend API', [
    'status' => 'OK',
    'timestamp' => date('Y-m-d H:i:s'),
    'platform' => 'Pure PHP + MySQL (PDO)',
    'course' => '503073 - Web Programming & Applications (TDTU)',
    'endpoints' => [
        'auth' => [
            'register' => 'api/auth/register.php',
            'login' => 'api/auth/login.php',
            'logout' => 'api/auth/logout.php',
            'activate' => 'api/auth/activate.php?token=...',
            'forgot_password' => 'api/auth/forgot-password.php',
            'verify_otp' => 'api/auth/verify-otp.php',
            'reset_password' => 'api/auth/reset-password.php'
        ],
        'users' => [
            'profile' => 'api/users/profile.php',
            'change_password' => 'api/users/change-password.php',
            'preferences' => 'api/users/preferences.php'
        ],
        'notes' => [
            'list_create' => 'api/notes/index.php',
            'detail_update_delete' => 'api/notes/detail.php?id=...',
            'pin' => 'api/notes/pin.php?id=...',
            'lock' => 'api/notes/lock.php?id=...',
            'unlock' => 'api/notes/unlock.php?id=...',
            'disable_lock' => 'api/notes/disable-lock.php?id=...',
            'change_password' => 'api/notes/change-password.php?id=...'
        ],
        'labels' => [
            'list_create' => 'api/labels/index.php',
            'update_delete' => 'api/labels/detail.php?id=...',
            'attach' => 'api/labels/attach.php?noteId=...'
        ],
        'shares' => [
            'share_note' => 'api/shares/share.php?noteId=...',
            'shared_with_me' => 'api/shares/shared-with-me.php',
            'note_shares' => 'api/shares/note-shares.php?noteId=...',
            'manage_share' => 'api/shares/manage-share.php?shareId=...'
        ],
        'attachments' => [
            'upload' => 'api/attachments/upload.php?noteId=...',
            'download' => 'api/attachments/download.php?id=...',
            'delete' => 'api/attachments/delete.php?id=...'
        ]
    ]
]);
