<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

$input = get_json_input();
$email = trim($input['email'] ?? '');

if (empty($email)) {
    json_response(400, false, 'Vui lòng cung cấp địa chỉ email.');
}

$stmt = $pdo->prepare("SELECT id, email, display_name FROM users WHERE email = ?");
$stmt->execute([strtolower($email)]);
$user = $stmt->fetch();

if (!$user) {
    json_response(404, false, 'Không tìm thấy tài khoản với địa chỉ email này.');
}

$otp = (string)rand(100000, 999999);
$reset_token = bin2hex(random_bytes(32));
$expires_at = date('Y-m-d H:i:s', time() + 15 * 60); // 15 phút

$update = $pdo->prepare("UPDATE users SET reset_password_otp = ?, reset_password_otp_expires_at = ?, reset_password_token = ? WHERE id = ?");
$update->execute([$otp, $expires_at, $reset_token, $user['id']]);

$is_sent_real = send_reset_password_mail($user['email'], $user['display_name'], $otp, $reset_token);

$message = $is_sent_real
    ? "Mã OTP xác thực đã được gửi đến email {$user['email']} của bạn."
    : "Mã OTP của bạn là: {$otp} (Đã lưu nhật ký tại backend-php/logs/mail_logs.txt)";

json_response(200, true, $message, [
    'otp_preview' => $otp,
    'reset_token_preview' => $reset_token,
    'smtp_sent' => $is_sent_real
]);
