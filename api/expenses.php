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

    $description = trim($_POST['description'] ?? '');
    $amount = floatval($_POST['amount'] ?? 0);
    $category = trim($_POST['category'] ?? '');
    $date = trim($_POST['date'] ?? date('Y-m-d'));
    $notes = trim($_POST['notes'] ?? '');

    if (empty($description)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Description is required']);
        exit;
    }
    if ($amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Amount must be positive']);
        exit;
    }
    if (empty($category)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Category is required']);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO expenses (description, amount, category, date, notes, branch_id, recorded_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$description, $amount, $category, $date, $notes, $branchId, $_SESSION['user_id']]);
    header('Location: ../index.php?page=finance&success=' . urlencode('Expense recorded'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $category = trim($_GET['category'] ?? '');
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $where = 'branch_id = ?';
    $params = [$branchId];
    if ($category !== '') {
        $where .= " AND category = ?";
        $params[] = $category;
    }

    $countStmt = $db->prepare("SELECT COUNT(*) FROM expenses WHERE $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    $params[] = $limit;
    $params[] = $offset;
    $stmt = $db->prepare("SELECT * FROM expenses WHERE $where ORDER BY date DESC LIMIT ? OFFSET ?");
    $stmt->execute($params);
    echo json_encode([
        'success' => true,
        'data' => [
            'expenses' => $stmt->fetchAll(),
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
