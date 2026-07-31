<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();
$branchId = getBranchId();
$role = getRole();
$method = $_SERVER['REQUEST_METHOD'];
$action = $_REQUEST['action'] ?? '';
$id = intval($_REQUEST['id'] ?? 0);

// CSRF validation for state-changing operations
if ($method === 'POST' || ($action === 'delete')) {
    $csrfToken = $_POST[CSRF_TOKEN_NAME] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!validateCSRFToken($csrfToken)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Invalid CSRF token']);
        exit;
    }
}

// Handle delete
if ($action === 'delete' && $id) {
    // Branch scoping: verify member belongs to user's branch (unless SUPER_ADMIN)
    $checkStmt = $db->prepare("SELECT id, branch_id FROM members WHERE id = ?");
    $checkStmt->execute([$id]);
    $member = $checkStmt->fetch();
    if (!$member) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Member not found']);
        exit;
    }
    if (!isSuperAdmin() && intval($member['branch_id']) !== $branchId) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Access denied']);
        exit;
    }
    $stmt = $db->prepare("DELETE FROM members WHERE id = ?");
    $stmt->execute([$id]);
    header('Location: ../index.php?page=members&success=' . urlencode('Member deleted'));
    exit;
}

if ($method === 'POST') {
    $action = $_POST['action'] ?? $action;

    if ($action === 'update' && $id) {
        // Branch scoping for update
        $checkStmt = $db->prepare("SELECT id, branch_id FROM members WHERE id = ?");
        $checkStmt->execute([$id]);
        $existing = $checkStmt->fetch();
        if (!$existing) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Member not found']);
            exit;
        }
        if (!isSuperAdmin() && intval($existing['branch_id']) !== $branchId) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Access denied']);
            exit;
        }

        $fields = ['first_name', 'last_name', 'middle_name', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'city', 'state', 'occupation', 'marital_status', 'anniversary_date', 'status', 'joined_date', 'notes'];
        $updates = [];
        $params = [];
        foreach ($fields as $f) {
            if (isset($_POST[$f])) {
                $updates[] = "$f = ?";
                $params[] = trim($_POST[$f]);
            }
        }
        if (empty($updates)) {
            header('Location: ../index.php?page=members_edit&id=' . $id . '&error=' . urlencode('No fields to update'));
            exit;
        }
        $params[] = $id;
        $stmt = $db->prepare("UPDATE members SET " . implode(', ', $updates) . " WHERE id = ?");
        $stmt->execute($params);
        header('Location: ../index.php?page=members&success=' . urlencode('Member updated successfully'));
        exit;
    }

    // Create member
    $fields = ['first_name', 'last_name', 'middle_name', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'city', 'state', 'occupation', 'marital_status', 'anniversary_date', 'status', 'joined_date', 'notes'];
    $inserts = [];
    foreach ($fields as $f) {
        if (isset($_POST[$f])) {
            $inserts[$f] = trim($_POST[$f]);
        }
    }
    $inserts['branch_id'] = $branchId;
    $columns = implode(', ', array_keys($inserts));
    $placeholders = implode(', ', array_fill(0, count($inserts), '?'));
    $stmt = $db->prepare("INSERT INTO members ($columns) VALUES ($placeholders)");
    $stmt->execute(array_values($inserts));
    header('Location: ../index.php?page=members&success=' . urlencode('Member added successfully'));
    exit;
}

if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $status = trim($_GET['status'] ?? '');
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    $where = isSuperAdmin() ? '1=1' : 'm.branch_id = ?';
    $params = isSuperAdmin() ? [] : [$branchId];

    if ($search !== '') {
        $where .= " AND (m.first_name LIKE ? OR m.last_name LIKE ? OR m.phone LIKE ? OR m.email LIKE ?)";
        $like = "%$search%";
        $params = array_merge($params, [$like, $like, $like, $like]);
    }
    if ($status !== '' && in_array($status, ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED'])) {
        $where .= " AND m.status = ?";
        $params[] = $status;
    }

    // Count total
    $countStmt = $db->prepare("SELECT COUNT(*) FROM members m WHERE $where");
    $countStmt->execute($params);
    $total = $countStmt->fetchColumn();

    // Fetch paginated results
    $params[] = $limit;
    $params[] = $offset;
    $stmt = $db->prepare("SELECT m.id, m.first_name, m.last_name, m.middle_name, m.phone, m.email, m.gender, m.city, m.status, m.joined_date, b.name as branch_name FROM members m JOIN branches b ON m.branch_id = b.id WHERE $where ORDER BY m.last_name, m.first_name LIMIT ? OFFSET ?");
    $stmt->execute($params);
    echo json_encode([
        'success' => true,
        'data' => [
            'members' => $stmt->fetchAll(),
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
?>