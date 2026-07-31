<?php
// Load environment variables from .env file
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $value) = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

loadEnv(__DIR__ . '/.env');
loadEnv(__DIR__ . '/.env.local');

// Database configuration
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'churchos');
define('DB_USER', $_ENV['DB_USER'] ?? 'root');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');

// Africa's Talking (SMS/WhatsApp)
define('AT_API_KEY', $_ENV['AFRICASTALKING_API_KEY'] ?? '');
define('AT_USERNAME', $_ENV['AFRICASTALKING_USERNAME'] ?? 'sandbox');
define('AT_BASE_URL', $_ENV['AFRICASTALKING_BASE_URL'] ?? 'https://api.sandbox.africastalking.com');

// Security configuration
define('CSRF_TOKEN_NAME', 'csrf_token');
define('SESSION_LIFETIME', 1800); // 30 minutes

// Get database connection
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            http_response_code(500);
            exit('A database error occurred. Please try again later.');
        }
    }
    return $pdo;
}

// Security headers
function setSecurityHeaders() {
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=()');
    header('Content-Security-Policy: default-src \'self\'; style-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net; font-src \'self\' https://cdn.jsdelivr.net; script-src \'self\' \'unsafe-inline\' https://cdn.jsdelivr.net; img-src \'self\' data:;');
    if ($_SERVER['HTTPS'] ?? '') {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
}

// CSRF token generation
function generateCSRFToken() {
    if (empty($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

function validateCSRFToken($token) {
    return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

function getCSRFInput() {
    return '<input type="hidden" name="' . CSRF_TOKEN_NAME . '" value="' . htmlspecialchars(generateCSRFToken()) . '">';
}

// Password validation
function validatePasswordStrength($password) {
    $errors = [];
    if (strlen($password) < 8) $errors[] = 'Password must be at least 8 characters';
    if (!preg_match('/[A-Z]/', $password)) $errors[] = 'Password must contain an uppercase letter';
    if (!preg_match('/[a-z]/', $password)) $errors[] = 'Password must contain a lowercase letter';
    if (!preg_match('/[0-9]/', $password)) $errors[] = 'Password must contain a number';
    return $errors;
}

// Input sanitization
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

// Start session with security settings
if (session_status() === PHP_SESSION_NONE) {
    $isProduction = ($_ENV['APP_ENV'] ?? '') === 'production' || ($_SERVER['HTTPS'] ?? '') === 'on';
    ini_set('session.cookie_httponly', 1);
    ini_set('session.cookie_secure', $isProduction ? 1 : 0);
    ini_set('session.use_strict_mode', 1);
    ini_set('session.cookie_samesite', 'Lax');
    session_start();
}
?>
