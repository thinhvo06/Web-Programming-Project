<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

$input = get_json_input();
$email = trim($input['email'] ?? '');
$otp = trim($input['otp'] ?? '');

if (empty($email) || empty($otp)) {
    json_response(400, false, 'Vui lòng cung cấp email và mã OTP.');
}

$stmt = $pdo->prepare("SELECT id, reset_password_otp, reset_password_otp_expires_at, reset_password_token FROM users WHERE email = ?");
$stmt->execute([strtolower($email)]);
$user = $stmt->fetch();

if (!$user || $user['reset_password_otp'] !== $otp) {
    json_response(400, false, 'Mã OTP không chính xác.');
}

if (strtotime($user['reset_password_otp_expires_at']) < time()) {
    json_response(400, false, 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.');
}

json_response(200, true, 'Mã OTP hợp lệ.', [
    'reset_token' => $user['reset_password_token']
]);
