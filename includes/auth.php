<?php
require_once __DIR__ . '/../config.php';

function isLoggedIn() {
    if (empty($_SESSION['user_id'])) return false;
    // Session timeout check
    if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity']) > SESSION_LIFETIME) {
        session_unset();
        session_destroy();
        session_start();
        return false;
    }
    $_SESSION['last_activity'] = time();
    return true;
}

function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: index.php?page=login');
        exit;
    }
}

function requireRole($roles) {
    requireLogin();
    if (!in_array($_SESSION['role'], (array)$roles, true)) {
        http_response_code(403);
        exit('Access denied. Insufficient permissions.');
    }
}

function getCurrentUser() {
    if (!isLoggedIn()) return null;
    $db = getDB();
    $stmt = $db->prepare("SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.branch_id, b.name as branch_name, b.code as branch_code FROM users u JOIN branches b ON u.branch_id = b.id WHERE u.id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

function getBranchId() {
    return intval($_SESSION['branch_id'] ?? 0);
}

function getRole() {
    return $_SESSION['role'] ?? '';
}

function isSuperAdmin() {
    return getRole() === 'SUPER_ADMIN';
}

function isBranchAdmin() {
    return getRole() === 'BRANCH_ADMIN';
}

function canManageUsers() {
    return in_array(getRole(), ['SUPER_ADMIN', 'BRANCH_ADMIN']);
}

function canViewFinance() {
    return in_array(getRole(), ['SUPER_ADMIN', 'BRANCH_ADMIN', 'TREASURER']);
}

function canManageMembers() {
    return in_array(getRole(), ['SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR', 'SECRETARY']);
}
?>
