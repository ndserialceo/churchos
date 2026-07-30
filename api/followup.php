<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();
$branchId = getBranchId();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $id = $_POST['id'] ?? 0;

    if ($action === 'complete' && $id) {
        $stmt = $db->prepare("UPDATE follow_ups SET status = 'COMPLETED', completed_at = NOW() WHERE id = ?");
        $stmt->execute([$id]);
        header('Location: ../index.php?page=followup&success=' . urlencode('Follow-up completed'));
        exit;
    }

    $stmt = $db->prepare("INSERT INTO follow_ups (type, notes, assigned_to, member_id, due_date, branch_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $_POST['type'] ?? '',
        $_POST['notes'] ?? '',
        $_POST['assigned_to'] ?? null,
        $_POST['member_id'] ?? 0,
        $_POST['due_date'] ?? null,
        $branchId
    ]);
    header('Location: ../index.php?page=followup&success=' . urlencode('Follow-up created'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $status = $_GET['status'] ?? '';
    $where = 'f.branch_id = ?';
    $params = [$branchId];
    if ($status) {
        $where .= " AND f.status = ?";
        $params[] = $status;
    }
    $stmt = $db->prepare("
        SELECT f.*, 
            m.first_name AS member_first_name, m.last_name AS member_last_name,
            u.first_name AS assigned_first_name, u.last_name AS assigned_last_name
        FROM follow_ups f
        JOIN members m ON f.member_id = m.id
        LEFT JOIN users u ON f.assigned_to = u.id
        WHERE $where
        ORDER BY f.created_at DESC
    ");
    $stmt->execute($params);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;