<?php
/**
 * Cấu hình SMTP để gửi mail thật (Gmail, Outlook, v.v.)
 * 
 * Để gửi mail thật đến Gmail:
 * 1. Bật Xác minh 2 bước trong tài khoản Google: https://myaccount.google.com/security
 * 2. Tạo "Mật khẩu ứng dụng" (App Password) tại: https://myaccount.google.com/apppasswords
 * 3. Điền 'smtp_user' và 'smtp_pass' (16 ký tự không dấu cách) dưới đây.
 * 
 * Nếu để trống, hệ thống sẽ tự động ghi nội dung email & mã OTP vào backend-php/logs/mail_logs.txt
 */

return [
    'smtp_host' => 'smtp.gmail.com',
    'smtp_port' => 465, // SSL
    'smtp_user' => '',  // Điền địa chỉ Gmail của bạn nếu muốn gửi mail thật
    'smtp_pass' => '',  // Điền App Password của Gmail
    'smtp_from' => 'TDTU Note App <noreply@tdtu.edu.vn>',
];
