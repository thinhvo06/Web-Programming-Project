<?php
/**
 * Built-in PHP Development Server Router for backend-php
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = ltrim($uri, '/');

// Strip 'backend-php/' prefix if request is proxied or routed with prefix
if (strpos($path, 'backend-php/') === 0) {
    $path = substr($path, strlen('backend-php/'));
}

$file = __DIR__ . '/' . $path;

// Serve existing static file directly
if ($path !== '' && is_file($file) && substr($file, -4) !== '.php') {
    return false;
}

// Serve existing PHP file directly
if ($path !== '' && is_file($file) && substr($file, -4) === '.php') {
    require $file;
    exit;
}

// Index page
if ($path === '' || $path === 'index.php') {
    require __DIR__ . '/index.php';
    exit;
}

// Route mapping
// Auth
if (preg_match('#^api/auth/activate/(.+)$#', $path, $m)) {
    $_GET['token'] = $m[1];
    require __DIR__ . '/api/auth/activate.php';
    exit;
}
if ($path === 'api/auth/activate') {
    require __DIR__ . '/api/auth/activate.php';
    exit;
}
if ($path === 'api/auth/register') {
    require __DIR__ . '/api/auth/register.php';
    exit;
}
if ($path === 'api/auth/login') {
    require __DIR__ . '/api/auth/login.php';
    exit;
}
if ($path === 'api/auth/logout') {
    require __DIR__ . '/api/auth/logout.php';
    exit;
}
if ($path === 'api/auth/forgot-password') {
    require __DIR__ . '/api/auth/forgot-password.php';
    exit;
}
if ($path === 'api/auth/verify-otp') {
    require __DIR__ . '/api/auth/verify-otp.php';
    exit;
}
if ($path === 'api/auth/reset-password') {
    require __DIR__ . '/api/auth/reset-password.php';
    exit;
}

// Users
if ($path === 'api/users/profile') {
    require __DIR__ . '/api/users/profile.php';
    exit;
}
if ($path === 'api/users/change-password') {
    require __DIR__ . '/api/users/change-password.php';
    exit;
}
if ($path === 'api/users/preferences') {
    require __DIR__ . '/api/users/preferences.php';
    exit;
}

// Notes
if (preg_match('#^api/notes/(\d+)/pin$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/notes/pin.php';
    exit;
}
if (preg_match('#^api/notes/(\d+)/lock$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/notes/lock.php';
    exit;
}
if (preg_match('#^api/notes/(\d+)/unlock$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/notes/unlock.php';
    exit;
}
if (preg_match('#^api/notes/(\d+)/disable-lock$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/notes/disable-lock.php';
    exit;
}
if (preg_match('#^api/notes/(\d+)/change-password$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/notes/change-password.php';
    exit;
}
if (preg_match('#^api/notes/(\d+)$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/notes/detail.php';
    exit;
}
if ($path === 'api/notes') {
    require __DIR__ . '/api/notes/index.php';
    exit;
}

// Shares
if (preg_match('#^api/shares/notes/(\d+)/share$#', $path, $m)) {
    $_GET['noteId'] = $m[1];
    require __DIR__ . '/api/shares/share.php';
    exit;
}
if (preg_match('#^api/shares/notes/(\d+)$#', $path, $m)) {
    $_GET['noteId'] = $m[1];
    require __DIR__ . '/api/shares/note-shares.php';
    exit;
}
if ($path === 'api/shares/shared-with-me') {
    require __DIR__ . '/api/shares/shared-with-me.php';
    exit;
}
if (preg_match('#^api/shares/(\d+)$#', $path, $m)) {
    $_GET['shareId'] = $m[1];
    require __DIR__ . '/api/shares/manage-share.php';
    exit;
}

// Labels
if ($path === 'api/labels/attach') {
    require __DIR__ . '/api/labels/attach.php';
    exit;
}
if (preg_match('#^api/labels/(\d+)$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/labels/detail.php';
    exit;
}
if ($path === 'api/labels') {
    require __DIR__ . '/api/labels/index.php';
    exit;
}

// Attachments
if ($path === 'api/attachments/upload') {
    require __DIR__ . '/api/attachments/upload.php';
    exit;
}
if (preg_match('#^api/attachments/download/(\d+)$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/attachments/download.php';
    exit;
}
if (preg_match('#^api/attachments/(\d+)$#', $path, $m)) {
    $_GET['id'] = $m[1];
    require __DIR__ . '/api/attachments/delete.php';
    exit;
}

// Fallback: check if .php exists
if (is_file(__DIR__ . '/' . $path . '.php')) {
    require __DIR__ . '/' . $path . '.php';
    exit;
}

// 404 Not Found
http_response_code(404);
echo json_encode([
    'success' => false,
    'message' => "Endpoint not found: {$path}"
], JSON_UNESCAPED_UNICODE);
