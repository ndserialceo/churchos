<?php
require_once __DIR__ . '/../config.php';

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: index.php?page=login');
        exit;
    }
}

function requireRole($roles) {
    requireLogin();
    if (!in_array($_SESSION['role'], $roles)) {
        die("Access denied. Insufficient permissions.");
    }
}

function getCurrentUser() {
    if (!isLoggedIn()) return null;
    $db = getDB();
    $stmt = $db->prepare("SELECT u.*, b.name as branch_name, b.code as branch_code FROM users u JOIN branches b ON u.branch_id = b.id WHERE u.id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

function getBranchId() {
    return $_SESSION['branch_id'] ?? 0;
}
?>
