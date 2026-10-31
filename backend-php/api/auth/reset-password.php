<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

$input = get_json_input();
$email = trim($input['email'] ?? '');
$otp = trim($input['otp'] ?? '');
$token = trim($input['token'] ?? '');
$new_password = $input['new_password'] ?? '';

if (empty($email) || empty($new_password)) {
    json_response(400, false, 'Vui lòng cung cấp email và mật khẩu mới.');
}

if (strlen($new_password) < 6) {
    json_response(400, false, 'Mật khẩu mới phải có ít nhất 6 ký tự.');
}

$stmt = $pdo->prepare("SELECT id, reset_password_otp, reset_password_otp_expires_at, reset_password_token FROM users WHERE email = ?");
$stmt->execute([strtolower($email)]);
$user = $stmt->fetch();

if (!$user) {
    json_response(404, false, 'Người dùng không tồn tại.');
}

$is_valid = false;
if (!empty($token) && $user['reset_password_token'] === $token) {
    $is_valid = true;
} elseif (!empty($otp) && $user['reset_password_otp'] === $otp) {
    if (strtotime($user['reset_password_otp_expires_at']) >= time()) {
        $is_valid = true;
    }
}

if (!$is_valid) {
    json_response(400, false, 'Mã OTP hoặc liên kết xác thực không hợp lệ hoặc đã hết hạn.');
}

$new_hash = password_hash($new_password, PASSWORD_BCRYPT);
$update = $pdo->prepare("UPDATE users SET password = ?, reset_password_otp = NULL, reset_password_otp_expires_at = NULL, reset_password_token = NULL WHERE id = ?");
$update->execute([$new_hash, $user['id']]);

json_response(200, true, 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại bằng mật khẩu mới.');
