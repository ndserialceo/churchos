<?php
// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'churchos');
define('DB_USER', 'root');
define('DB_PASS', '');

// Africa's Talking (SMS/WhatsApp)
define('AT_API_KEY', 'your-api-key-here');
define('AT_USERNAME', 'sandbox');
define('AT_BASE_URL', 'https://api.sandbox.africastalking.com');

// Get database connection
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
            );
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }
    return $pdo;
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
