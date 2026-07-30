<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
header('Content-Type: application/json');

requireLogin();
$db = getDB();
$branchId = getBranchId();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';

    if ($action === 'announcement') {
        $stmt = $db->prepare("INSERT INTO announcements (title, content, priority, created_by, branch_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([
            $_POST['title'] ?? '',
            $_POST['content'] ?? '',
            $_POST['priority'] ?? 'NORMAL',
            $_SESSION['user_id'],
            $branchId
        ]);
        header('Location: ../index.php?page=communication&success=' . urlencode('Announcement posted'));
        exit;
    }

    $stmt = $db->prepare("INSERT INTO communications (type, recipient, subject, message, status, member_id, branch_id, sent_by) VALUES (?, ?, ?, ?, 'SENT', ?, ?, ?)");
    $stmt->execute([
        $_POST['type'] ?? '',
        $_POST['recipient'] ?? '',
        $_POST['subject'] ?? '',
        $_POST['message'] ?? '',
        $_POST['member_id'] ?? null,
        $branchId,
        $_SESSION['user_id']
    ]);
    header('Location: ../index.php?page=communication&success=' . urlencode('Message sent'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';

    if ($action === 'announcements') {
        $stmt = $db->prepare("SELECT a.*, u.first_name, u.last_name FROM announcements a JOIN users u ON a.created_by = u.id ORDER BY a.created_at DESC");
        $stmt->execute();
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    $stmt = $db->prepare("SELECT c.*, m.first_name, m.last_name FROM communications c LEFT JOIN members m ON c.member_id = m.id WHERE c.branch_id = ? ORDER BY c.created_at DESC");
    $stmt->execute([$branchId]);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;