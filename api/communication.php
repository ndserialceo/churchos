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

    if ($action === 'announcement') {
        $title = trim($_POST['title'] ?? '');
        $content = trim($_POST['content'] ?? '');
        if (empty($title) || empty($content)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Title and content are required']);
            exit;
        }
        $priority = $_POST['priority'] ?? 'NORMAL';
        if (!in_array($priority, ['LOW', 'NORMAL', 'HIGH', 'URGENT'])) {
            $priority = 'NORMAL';
        }
        $stmt = $db->prepare("INSERT INTO announcements (title, content, priority, created_by, branch_id) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$title, $content, $priority, $_SESSION['user_id'], $branchId]);
        header('Location: ../index.php?page=communication&success=' . urlencode('Announcement posted'));
        exit;
    }

    $type = $_POST['type'] ?? '';
    if (!in_array($type, ['SMS', 'WHATSAPP', 'EMAIL'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid communication type']);
        exit;
    }
    $recipient = trim($_POST['recipient'] ?? '');
    $subject = trim($_POST['subject'] ?? '');
    $message = trim($_POST['message'] ?? '');
    if (empty($recipient) || empty($message)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Recipient and message are required']);
        exit;
    }

    $stmt = $db->prepare("INSERT INTO communications (type, recipient, subject, message, status, member_id, branch_id, sent_by) VALUES (?, ?, ?, ?, 'SENT', ?, ?, ?)");
    $stmt->execute([$type, $recipient, $subject, $message, intval($_POST['member_id'] ?? 0) ?: null, $branchId, $_SESSION['user_id']]);
    header('Location: ../index.php?page=communication&success=' . urlencode('Message sent'));
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    $page = max(1, intval($_GET['page'] ?? 1));
    $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
    $offset = ($page - 1) * $limit;

    if ($action === 'announcements') {
        $stmt = $db->prepare("SELECT a.id, a.title, a.content, a.priority, a.created_at, u.first_name, u.last_name FROM announcements a JOIN users u ON a.created_by = u.id WHERE a.branch_id = ? ORDER BY a.created_at DESC LIMIT ? OFFSET ?");
        $stmt->execute([$branchId, $limit, $offset]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    $params = [$branchId, $limit, $offset];
    $stmt = $db->prepare("SELECT c.id, c.type, c.recipient, c.subject, c.message, c.status, c.sent_at, c.created_at, m.first_name, m.last_name FROM communications c LEFT JOIN members m ON c.member_id = m.id WHERE c.branch_id = ? ORDER BY c.created_at DESC LIMIT ? OFFSET ?");
    $stmt->execute($params);
    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Invalid request method']);
exit;
