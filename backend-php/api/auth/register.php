<?php
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/jwt.php';
require_once __DIR__ . '/../../helpers/mailer.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, false, 'Phương thức không được hỗ trợ.');
}

$input = get_json_input();
$email = trim($input['email'] ?? '');
$display_name = trim($input['display_name'] ?? ($input['displayName'] ?? ''));
$password = $input['password'] ?? '';

if (empty($email) || empty($display_name) || empty($password)) {
    json_response(400, false, 'Vui lòng cung cấp đầy đủ email, tên hiển thị và mật khẩu.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(400, false, 'Email không đúng định dạng.');
}

if (strlen($password) < 6) {
    json_response(400, false, 'Mật khẩu phải có ít nhất 6 ký tự.');
}

// Kiểm tra trùng email
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([strtolower($email)]);
if ($stmt->fetch()) {
    json_response(409, false, 'Email này đã được sử dụng. Vui lòng chọn email khác.');
}

// Băm mật khẩu bcrypt
$password_hash = password_hash($password, PASSWORD_BCRYPT);
$activation_token = bin2hex(random_bytes(32));
$default_preferences = json_encode(['fontSize' => 'medium', 'noteColor' => 'default', 'theme' => 'light']);

$insert = $pdo->prepare("INSERT INTO users (email, display_name, password, is_activated, activation_token, preferences) VALUES (?, ?, ?, 0, ?, ?)");
$insert->execute([strtolower($email), $display_name, $password_hash, $activation_token, $default_preferences]);
$user_id = $pdo->lastInsertId();

// Tự động đăng nhập: Cấp JWT Token
$token = generate_jwt([
    'id' => $user_id,
    'email' => strtolower($email),
    'display_name' => $display_name
], $jwt_secret);

// Gửi mail kích hoạt tài khoản
send_activation_mail(strtolower($email), $display_name, $activation_token);

json_response(201, true, 'Đăng ký tài khoản thành công! Link kích hoạt đã được gửi đến email của bạn.', [
    'token' => $token,
    'activation_token_preview' => $activation_token,
    'user' => [
        'id' => (int)$user_id,
        'email' => strtolower($email),
        'display_name' => $display_name,
        'avatar_url' => '/public/default-avatar.svg',
        'is_activated' => false,
        'preferences' => json_decode($default_preferences, true)
    ]
]);
