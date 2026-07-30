<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    $stmt = $db->prepare("
        SELECT u.*, b.name as branch_name, b.code as branch_code 
        FROM users u 
        JOIN branches b ON u.branch_id = b.id 
        WHERE u.email = ? AND u.is_active = 1
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['branch_id'] = $user['branch_id'];

        header('Location: ../index.php?page=dashboard');
        exit;
    }

    header('Location: ../index.php?page=login&error=' . urlencode('Invalid email or password'));
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;
