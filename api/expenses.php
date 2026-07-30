<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();
$branchId = getBranchId();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $stmt = $db->prepare("INSERT INTO expenses (description, amount, category, date, notes, branch_id, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $_POST['description'] ?? '',
        $_POST['amount'] ?? 0,
        $_POST['category'] ?? '',
        $_POST['date'] ?? date('Y-m-d'),
        $_POST['notes'] ?? '',
        $branchId,
        $_SESSION['user_id']
    ]);
    header('Location: ../index.php?page=finance&success=' . urlencode('Expense recorded'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $category = $_GET['category'] ?? '';
    $where = 'branch_id = ?';
    $params = [$branchId];
    if ($category) {
        $where .= " AND category = ?";
        $params[] = $category;
    }
    $stmt = $db->prepare("SELECT * FROM expenses WHERE $where ORDER BY date DESC");
    $stmt->execute($params);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;