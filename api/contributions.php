<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();
$branchId = getBranchId();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $db->prepare("INSERT INTO contributions (type, amount, date, notes, member_id, branch_id, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $_POST['type'] ?? '',
        $_POST['amount'] ?? 0,
        $_POST['date'] ?? date('Y-m-d'),
        $_POST['notes'] ?? '',
        $_POST['member_id'] ?? 0,
        $branchId,
        $_SESSION['user_id']
    ]);
    header('Location: ../index.php?page=finance&success=' . urlencode('Contribution recorded'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = $_GET['type'] ?? '';
    $where = 'c.branch_id = ?';
    $params = [$branchId];
    if ($type) {
        $where .= " AND c.type = ?";
        $params[] = $type;
    }
    $stmt = $db->prepare("
        SELECT c.*, m.first_name, m.last_name 
        FROM contributions c 
        JOIN members m ON c.member_id = m.id 
        WHERE $where 
        ORDER BY c.date DESC
    ");
    $stmt->execute($params);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;
