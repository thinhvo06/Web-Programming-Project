<?php
/**
 * Helper gửi Email trong PHP thuần (hỗ trợ cả mail() và ghi log kiểm thử)
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

function send_activation_mail($email, $display_name, $token) {
    global $frontend_url;
    $link = "{$frontend_url}/activate/{$token}";
    $subject = "[TDTU Note App] Kích hoạt tài khoản";
    $content = "Xin chào {$display_name},\nVui lòng nhấn vào liên kết sau để kích hoạt tài khoản của bạn:\n{$link}\n";

    // Ghi log để chấm bài
    log_mail_to_file($email, $subject, $content);

    // Gửi mail bằng hàm chuẩn của PHP nếu máy chủ có sendmail
    $headers = "From: noreply@tdtu.edu.vn\r\nReply-To: noreply@tdtu.edu.vn\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    @mail($email, $subject, $content, $headers);
    return true;
}

function send_reset_password_mail($email, $display_name, $otp, $token) {
    global $frontend_url;
    $link = "{$frontend_url}/reset-password?token={$token}&email=" . urlencode($email);
    $subject = "[TDTU Note App] Khôi phục mật khẩu";
    $content = "Xin chào {$display_name},\nMã OTP đặt lại mật khẩu của bạn là: {$otp} (Hiệu lực trong 15 phút).\nHoặc bạn có thể truy cập liên kết: {$link}\n";

    log_mail_to_file($email, $subject, $content);

    $headers = "From: noreply@tdtu.edu.vn\r\nReply-To: noreply@tdtu.edu.vn\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    @mail($email, $subject, $content, $headers);
    return true;
}

function send_share_note_mail($recipient_email, $recipient_name, $owner_name, $note_title, $permission) {
    global $frontend_url;
    $perm_text = ($permission === 'edit') ? 'Chỉnh sửa (Edit)' : 'Chỉ xem (Read-only)';
    $subject = "[TDTU Note App] {$owner_name} đã chia sẻ ghi chú cho bạn";
    $content = "Xin chào {$recipient_name},\n{$owner_name} vừa chia sẻ ghi chú '{$note_title}' cho bạn với quyền {$perm_text}.\nHãy đăng nhập vào ứng dụng để xem chi tiết!\n";

    log_mail_to_file($recipient_email, $subject, $content);

    $headers = "From: noreply@tdtu.edu.vn\r\nReply-To: noreply@tdtu.edu.vn\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    @mail($recipient_email, $subject, $content, $headers);
    return true;
}
