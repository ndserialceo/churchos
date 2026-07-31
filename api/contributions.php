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

    if (!canViewFinance()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Insufficient permissions']);
        exit;
    }

    $type = trim($_POST['type'] ?? '');
    $amount = floatval($_POST['amount'] ?? 0);
    $date = trim($_POST['date'] ?? date('Y-m-d'));
    $notes = trim($_POST['notes'] ?? '');
    $memberId = intval($_POST['member_id'] ?? 0);

    if (empty($type) || !in_array($type, ['TITHE', 'OFFERING', 'PLEDGE', 'SPECIAL_DONATION'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid contribution type']);
        exit;
    }
    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Amount must be positive']);
        exit;
    }
    if ($memberId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Member is required']);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO contributions (type, amount, date, notes, member_id, branch_id, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$type, $amount, $date, $notes, $memberId, $branchId, $_SESSION['user_id']]);
    header('Location: ../index.php?page=finance&success=' . urlencode('Contribution recorded'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $type = trim($_GET['type'] ?? '');
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $where = 'c.branch_id = ?';
    $params = [$branchId];
    if ($type && in_array($type, ['TITHE', 'OFFERING', 'PLEDGE', 'SPECIAL_DONATION'])) {
        $where .= " AND c.type = ?";
        $params[] = $type;
    }

    $countStmt = $db->prepare("SELECT COUNT(*) FROM contributions c WHERE $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    $params[] = $limit;
    $params[] = $offset;
    $stmt = $db->prepare("
        SELECT c.id, c.type, c.amount, c.currency, c.date, c.notes, c.created_at, m.first_name, m.last_name 
        FROM contributions c 
        JOIN members m ON c.member_id = m.id 
        WHERE $where 
        ORDER BY c.date DESC
        LIMIT ? OFFSET ?
    ");
    $stmt->execute($params);
    echo json_encode([
        'success' => true,
        'data' => [
            'contributions' => $stmt->fetchAll(),
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
