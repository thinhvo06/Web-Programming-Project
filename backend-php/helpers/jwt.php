<?php
/**
 * Thuần PHP JWT (JSON Web Token) Helper - Không cần cài thư viện ngoài
 */

function base64_url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64_url_decode($data) {
    return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
}

/**
 * Tạo token JWT có thời hạn
 */
function generate_jwt($payload, $secret, $exp_seconds = 604800) { // 7 ngày
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + $exp_seconds;
    $payload_json = json_encode($payload);

    $base64_header = base64_url_encode($header);
    $base64_payload = base64_url_encode($payload_json);

    $signature = hash_hmac('sha256', "{$base64_header}.{$base64_payload}", $secret, true);
    $base64_signature = base64_url_encode($signature);

    return "{$base64_header}.{$base64_payload}.{$base64_signature}";
}

/**
 * Xác thực và giải mã token JWT
 */
function verify_jwt($jwt, $secret) {
    if (empty($jwt)) return false;

    $parts = explode('.', $jwt);
    if (count($parts) !== 3) return false;

    list($base64_header, $base64_payload, $base64_signature) = $parts;

    $signature = base64_url_decode($base64_signature);
    $expected_signature = hash_hmac('sha256', "{$base64_header}.{$base64_payload}", $secret, true);

    if (!hash_equals($expected_signature, $signature)) {
        return false;
    }

    $payload = json_decode(base64_url_decode($base64_payload), true);
    if (!$payload) return false;

    // Kiểm tra hạn sử dụng
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false; // Đã hết hạn
    }

    return $payload;
}
