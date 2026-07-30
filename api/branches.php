<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($_SESSION['role'] !== 'SUPER_ADMIN') {
        header('Location: ../index.php?page=branches&error=' . urlencode('Access denied'));
        exit;
    }

    $stmt = $db->prepare("INSERT INTO branches (name, code, address, city, state, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $_POST['name'] ?? '',
        $_POST['code'] ?? '',
        $_POST['address'] ?? '',
        $_POST['city'] ?? '',
        $_POST['state'] ?? '',
        $_POST['phone'] ?? '',
        $_POST['email'] ?? ''
    ]);
    header('Location: ../index.php?page=branches&success=' . urlencode('Branch created'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $db->prepare("
        SELECT b.*,
            (SELECT COUNT(*) FROM members WHERE branch_id = b.id) AS members_count,
            (SELECT COUNT(*) FROM users WHERE branch_id = b.id) AS users_count,
            (SELECT COUNT(*) FROM contributions WHERE branch_id = b.id) AS contributions_count
        FROM branches b
        ORDER BY b.name
    ");
    $stmt->execute();
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;