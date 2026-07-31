<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isSuperAdmin()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Only Super Admin can create branches']);
        exit;
    }

    $csrfToken = $_POST[CSRF_TOKEN_NAME] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!validateCSRFToken($csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
        exit;
    }

    $name = trim($_POST['name'] ?? '');
    $code = trim($_POST['code'] ?? '');

    if (empty($name) || empty($code)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Name and code are required']);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO branches (name, code, address, city, state, phone, email) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $name,
        $code,
        trim($_POST['address'] ?? ''),
        trim($_POST['city'] ?? ''),
        trim($_POST['state'] ?? ''),
        trim($_POST['phone'] ?? ''),
        trim($_POST['email'] ?? '')
    ]);
    header('Location: ../index.php?page=branches&success=' . urlencode('Branch created'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isSuperAdmin()) {
        $stmt = $db->prepare("
            SELECT b.*,
                (SELECT COUNT(*) FROM members WHERE branch_id = b.id) AS members_count,
                (SELECT COUNT(*) FROM users WHERE branch_id = b.id) AS users_count,
                (SELECT COUNT(*) FROM contributions WHERE branch_id = b.id) AS contributions_count
            FROM branches b
            ORDER BY b.name
        ");
        $stmt->execute();
    } else {
        $stmt = $db->prepare("
            SELECT b.*,
                (SELECT COUNT(*) FROM members WHERE branch_id = b.id) AS members_count,
                (SELECT COUNT(*) FROM users WHERE branch_id = b.id) AS users_count,
                (SELECT COUNT(*) FROM contributions WHERE branch_id = b.id) AS contributions_count
            FROM branches b
            WHERE b.id = ?
        ");
        $stmt->execute([getBranchId()]);
    }
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;
