<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();
$branchId = getBranchId();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'role') {
        $stmt = $db->prepare("INSERT INTO volunteer_roles (name, description, branch_id) VALUES (?, ?, ?)");
        $stmt->execute([$_POST['name'] ?? '', $_POST['description'] ?? '', $branchId]);
        header('Location: ../index.php?page=volunteers&success=' . urlencode('Role created'));
        exit;
    }

    if ($action === 'assign') {
        $stmt = $db->prepare("INSERT INTO volunteer_assignments (member_id, role_id, branch_id, start_date) VALUES (?, ?, ?, CURDATE())");
        $stmt->execute([$_POST['member_id'] ?? 0, $_POST['role_id'] ?? 0, $branchId]);
        header('Location: ../index.php?page=volunteers&success=' . urlencode('Member assigned'));
        exit;
    }

    header('Location: ../index.php?page=volunteers&error=' . urlencode('Invalid action'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $roles = $db->prepare("
        SELECT vr.*, COUNT(va.id) AS assignments_count
        FROM volunteer_roles vr
        LEFT JOIN volunteer_assignments va ON vr.id = va.role_id AND va.is_active = 1
        WHERE vr.branch_id = ?
        GROUP BY vr.id
        ORDER BY vr.name
    ");
    $roles->execute([$branchId]);

    $assignments = $db->prepare("
        SELECT va.*, m.first_name, m.last_name, vr.name AS role_name
        FROM volunteer_assignments va
        JOIN members m ON va.member_id = m.id
        JOIN volunteer_roles vr ON va.role_id = vr.id
        WHERE va.branch_id = ? AND va.is_active = 1
        ORDER BY vr.name, m.last_name
    ");
    $assignments->execute([$branchId]);

    echo json_encode([
        'success' => true,
        'data' => [
            'roles' => $roles->fetchAll(),
            'assignments' => $assignments->fetchAll()
        ]
    ]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;