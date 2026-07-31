<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// CSRF validation
$csrfToken = $_POST[CSRF_TOKEN_NAME] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
if (!validateCSRFToken($csrfToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
    exit;
}

$email = strtolower(trim($_POST['email'] ?? ''));
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Email and password are required']);
    exit;
}

$db = getDB();
$stmt = $db->prepare("SELECT u.id, u.email, u.password, u.first_name, u.last_name, u.role, u.is_active, u.branch_id FROM users u WHERE u.email = ? AND u.is_active = 1");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    // Regenerate session ID to prevent session fixation even on failed login
    session_regenerate_id(true);
    error_log("Failed login attempt for email: $email from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
    header('Location: ../index.php?page=login&error=' . urlencode('Invalid email or password'));
    exit;
}

// Regenerate session ID to prevent session fixation
session_regenerate_id(true);

$_SESSION['user_id'] = $user['id'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];
$_SESSION['branch_id'] = $user['branch_id'];
$_SESSION['last_activity'] = time();

header('Location: ../index.php?page=dashboard');
exit;
?>
