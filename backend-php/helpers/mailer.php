<?php
/**
 * Helper gửi Email trong PHP thuần (hỗ trợ cả SMTP Gmail và ghi log kiểm thử)
 */

function log_mail_to_file($to, $subject, $content) {
    $log_dir = __DIR__ . '/../logs';
    if (!is_dir($log_dir)) {
        @mkdir($log_dir, 0777, true);
    }
    $log_file = $log_dir . '/mail_logs.txt';
    $timestamp = date('Y-m-d H:i:s');
    $log_entry = "====================================================\n" .
                 "Thời gian: {$timestamp}\n" .
                 "Gửi tới: {$to}\n" .
                 "Tiêu đề: {$subject}\n" .
                 "Nội dung:\n{$content}\n" .
                 "====================================================\n\n";
    @file_put_contents($log_file, $log_entry, FILE_APPEND);
}

function send_smtp_socket($to, $subject, $content, $config) {
    $host = $config['smtp_host'] ?? 'smtp.gmail.com';
    $port = (int)($config['smtp_port'] ?? 465);
    $user = trim($config['smtp_user'] ?? '');
    $pass = trim($config['smtp_pass'] ?? '');
    $from = $config['smtp_from'] ?? "TDTU Note App <{$user}>";

    if (empty($user) || empty($pass)) {
        return false;
    }

    $remote = ($port === 465) ? "ssl://{$host}" : "tcp://{$host}";
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client("{$remote}:{$port}", $errno, $errstr, 10, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        return false;
    }

    $read = function() use ($socket) {
        $data = '';
        while ($str = fgets($socket, 515)) {
            $data .= $str;
            if (isset($str[3]) && $str[3] === ' ') break;
        }
        return $data;
    };

    $send = function($cmd) use ($socket, $read) {
        fputs($socket, $cmd . "\r\n");
        return $read();
    };

    $read();
    $send("EHLO localhost");

    if ($port === 587) {
        $send("STARTTLS");
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $send("EHLO localhost");
    }

    $send("AUTH LOGIN");
    $send(base64_encode($user));
    $auth_res = $send(base64_encode($pass));
    if (strpos($auth_res, '235') === false) {
        fclose($socket);
        return false;
    }

    $send("MAIL FROM: <{$user}>");
    $send("RCPT TO: <{$to}>");
    $send("DATA");

    $headers = [
        "From: {$from}",
        "To: {$to}",
        "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: 8bit",
        "Date: " . date('r')
    ];

    $payload = implode("\r\n", $headers) . "\r\n\r\n" . $content . "\r\n.";
    $send($payload);
    $send("QUIT");
    fclose($socket);
    return true;
}

function send_email_message($to, $subject, $content) {
    // 1. Luôn ghi log vào file nhật ký kiểm thử
    log_mail_to_file($to, $subject, $content);

    // 2. Kiểm tra nếu có cấu hình SMTP thực tế
    $mail_config_file = __DIR__ . '/../config/mail.php';
    if (file_exists($mail_config_file)) {
        $config = require $mail_config_file;
        if (!empty($config['smtp_user']) && !empty($config['smtp_pass'])) {
            $smtp_ok = send_smtp_socket($to, $subject, $content, $config);
            if ($smtp_ok) {
                return true;
            }
        }
    }

    // 3. Fallback: Nội dung email đã được lưu tại backend-php/logs/mail_logs.txt
    return true;
}

function send_activation_mail($email, $display_name, $token) {
    global $frontend_url;
    $link = "{$frontend_url}/activate/{$token}";
    $subject = "[TDTU Note App] Kích hoạt tài khoản";
    $content = "Xin chào {$display_name},\nVui lòng nhấn vào liên kết sau để kích hoạt tài khoản của bạn:\n{$link}\n";

    return send_email_message($email, $subject, $content);
}

function send_reset_password_mail($email, $display_name, $otp, $token) {
    global $frontend_url;
    $link = "{$frontend_url}/reset-password?token={$token}&email=" . urlencode($email);
    $subject = "[TDTU Note App] Khôi phục mật khẩu";
    $content = "Xin chào {$display_name},\nMã OTP đặt lại mật khẩu của bạn là: {$otp} (Hiệu lực trong 15 phút).\nHoặc bạn có thể truy cập liên kết: {$link}\n";

    return send_email_message($email, $subject, $content);
}

function send_share_note_mail($recipient_email, $recipient_name, $owner_name, $note_title, $permission) {
    global $frontend_url;
    $perm_text = ($permission === 'edit') ? 'Chỉnh sửa (Edit)' : 'Chỉ xem (Read-only)';
    $subject = "[TDTU Note App] {$owner_name} đã chia sẻ ghi chú cho bạn";
    $content = "Xin chào {$recipient_name},\n{$owner_name} vừa chia sẻ ghi chú '{$note_title}' cho bạn với quyền {$perm_text}.\nHãy đăng nhập vào ứng dụng để xem chi tiết!\n";

    return send_email_message($recipient_email, $subject, $content);
}
