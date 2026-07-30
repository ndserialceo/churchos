<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDB();
$user = getCurrentUser();
$branchId = getBranchId();

header('Content-Type: application/json');

if ($user['role'] === 'SUPER_ADMIN') {
    $totalMembers = $db->query("SELECT COUNT(*) FROM members")->fetchColumn();
    $activeMembers = $db->query("SELECT COUNT(*) FROM members WHERE status='ACTIVE'")->fetchColumn();
    $contributionsThisMonth = $db->query("SELECT COALESCE(SUM(amount),0) FROM contributions WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())")->fetchColumn();
    $pendingFollowUps = $db->query("SELECT COUNT(*) FROM follow_ups WHERE status='PENDING'")->fetchColumn();
    $totalVolunteers = $db->query("SELECT COUNT(*) FROM volunteer_assignments WHERE is_active=1")->fetchColumn();
    $totalBranches = $db->query("SELECT COUNT(*) FROM branches")->fetchColumn();
} else {
    $bid = intval($branchId);
    $totalMembers = $db->query("SELECT COUNT(*) FROM members WHERE branch_id=$bid")->fetchColumn();
    $activeMembers = $db->query("SELECT COUNT(*) FROM members WHERE branch_id=$bid AND status='ACTIVE'")->fetchColumn();
    $contributionsThisMonth = $db->query("SELECT COALESCE(SUM(amount),0) FROM contributions WHERE branch_id=$bid AND MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())")->fetchColumn();
    $pendingFollowUps = $db->query("SELECT COUNT(*) FROM follow_ups WHERE branch_id=$bid AND status='PENDING'")->fetchColumn();
    $totalVolunteers = $db->query("SELECT COUNT(*) FROM volunteer_assignments WHERE branch_id=$bid AND is_active=1")->fetchColumn();
    $totalBranches = 1;
}

echo json_encode([
    'totalMembers' => (int)$totalMembers,
    'activeMembers' => (int)$activeMembers,
    'contributionsThisMonth' => (float)$contributionsThisMonth,
    'pendingFollowUps' => (int)$pendingFollowUps,
    'totalVolunteers' => (int)$totalVolunteers,
    'totalBranches' => (int)$totalBranches,
]);
