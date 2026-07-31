<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();
$branchId = getBranchId();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $csrfToken = $_POST[CSRF_TOKEN_NAME] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!validateCSRFToken($csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
        exit;
    }

    $action = $_POST['action'] ?? '';

    if ($action === 'role') {
        $name = trim($_POST['name'] ?? '');
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Role name is required']);
            exit;
        }
        $stmt = $db->prepare("INSERT INTO volunteer_roles (name, description, branch_id) VALUES (?, ?, ?)");
        $stmt->execute([$name, trim($_POST['description'] ?? ''), $branchId]);
        header('Location: ../index.php?page=volunteers&success=' . urlencode('Role created'));
        exit;
    }

    if ($action === 'assign') {
        $memberId = intval($_POST['member_id'] ?? 0);
        $roleId = intval($_POST['role_id'] ?? 0);
        if ($memberId <= 0 || $roleId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Member and role are required']);
            exit;
        }
        $stmt = $db->prepare("INSERT INTO volunteer_assignments (member_id, role_id, branch_id, start_date) VALUES (?, ?, ?, CURDATE())");
        $stmt->execute([$memberId, $roleId, $branchId]);
        header('Location: ../index.php?page=volunteers&success=' . urlencode('Member assigned'));
        exit;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid action']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $roles = $db->prepare("
        SELECT vr.id, vr.name, vr.description, vr.created_at, COUNT(va.id) AS assignments_count
        FROM volunteer_roles vr
        LEFT JOIN volunteer_assignments va ON vr.id = va.role_id AND va.is_active = 1
        WHERE vr.branch_id = ?
        GROUP BY vr.id
        ORDER BY vr.name
    ");
    $roles->execute([$branchId]);

    $assignments = $db->prepare("
        SELECT va.id, va.start_date, va.end_date, va.is_active, m.id AS member_id, m.first_name, m.last_name, vr.id AS role_id, vr.name AS role_name
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

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;
