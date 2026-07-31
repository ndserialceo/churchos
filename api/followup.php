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
    $id = intval($_POST['id'] ?? 0);

    if ($action === 'complete' && $id) {
        $stmt = $db->prepare("UPDATE follow_ups SET status = 'COMPLETED', completed_at = NOW() WHERE id = ? AND branch_id = ?");
        $stmt->execute([$id, $branchId]);
        header('Location: ../index.php?page=followup&success=' . urlencode('Follow-up completed'));
        exit;
    }

    $type = trim($_POST['type'] ?? '');
    $notes = trim($_POST['notes'] ?? '');
    $assignedTo = intval($_POST['assigned_to'] ?? 0);
    $memberId = intval($_POST['member_id'] ?? 0);
    $dueDate = trim($_POST['due_date'] ?? '');

    if (empty($type)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Type is required']);
        exit;
    }
    if ($memberId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Member is required']);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO follow_ups (type, notes, assigned_to, member_id, due_date, branch_id) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$type, $notes, $assignedTo ?: null, $memberId, $dueDate ?: null, $branchId]);
    header('Location: ../index.php?page=followup&success=' . urlencode('Follow-up created'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $status = trim($_GET['status'] ?? '');
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $where = 'f.branch_id = ?';
    $params = [$branchId];
    if ($status !== '' && in_array($status, ['PENDING', 'IN_PROGRESS', 'COMPLETED'])) {
        $where .= " AND f.status = ?";
        $params[] = $status;
    }

    $countStmt = $db->prepare("SELECT COUNT(*) FROM follow_ups f WHERE $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    $params[] = $limit;
    $params[] = $offset;
    $stmt = $db->prepare("
        SELECT f.id, f.type, f.notes, f.status, f.due_date, f.completed_at, f.created_at,
            m.first_name AS member_first_name, m.last_name AS member_last_name,
            u.first_name AS assigned_first_name, u.last_name AS assigned_last_name
        FROM follow_ups f
        JOIN members m ON f.member_id = m.id
        LEFT JOIN users u ON f.assigned_to = u.id
        WHERE $where
        ORDER BY f.created_at DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute($params);
    echo json_encode([
        'success' => true,
        'data' => [
            'followUps' => $stmt->fetchAll(),
            'total' => (int)$total,
            'page' => $page,
            'limit' => $limit,
            'totalPages' => ceil($total / $limit),
        ]
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;
