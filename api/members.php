<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();
$branchId = getBranchId();
$role = $_SESSION['role'] ?? '';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_REQUEST['action'] ?? '';
$id = $_REQUEST['id'] ?? 0;

// Handle actions that work with both GET and POST (delete, complete, etc.)
if ($action === 'delete' && $id) {
    $stmt = $db->prepare("DELETE FROM members WHERE id = ?");
    $stmt->execute([$id]);
    header('Location: ../index.php?page=members&success=' . urlencode('Member deleted'));
    exit;
}

if ($method === 'POST') {
    if ($action === 'update' && $id) {
        $fields = ['first_name', 'last_name', 'middle_name', 'date_of_birth', 'gender', 'phone', 'email', 'address', 'city', 'state', 'occupation', 'marital_status', 'anniversary_date', 'status', 'joined_date', 'notes'];
        $updates = [];
        $params = [];
        foreach ($fields as $f) {
            if (isset($_POST[$f])) {
                $updates[] = "$f = ?";
                $params[] = $_POST[$f];
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
            $inserts[$f] = $_POST[$f];
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
    $search = $_GET['search'] ?? '';
    $status = $_GET['status'] ?? '';
    $where = $role === 'SUPER_ADMIN' ? '1=1' : 'm.branch_id = ?';
    $params = $role === 'SUPER_ADMIN' ? [] : [$branchId];

    if ($search) {
        $where .= " AND (m.first_name LIKE ? OR m.last_name LIKE ? OR m.phone LIKE ? OR m.email LIKE ?)";
        $like = "%$search%";
        $params = array_merge($params, [$like, $like, $like, $like]);
    }
    if ($status) {
        $where .= " AND m.status = ?";
        $params[] = $status;
    }

    $stmt = $db->prepare("SELECT m.*, b.name as branch_name FROM members m JOIN branches b ON m.branch_id = b.id WHERE $where ORDER BY m.last_name, m.first_name");
    $stmt->execute($params);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;