<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDB();
$user = getCurrentUser();
$branchId = getBranchId();
$isSuperAdmin = isSuperAdmin();

header('Content-Type: application/json');

if ($isSuperAdmin) {
    $totalMembers = $db->query("SELECT COUNT(*) FROM members")->fetchColumn();
    $activeMembers = $db->query("SELECT COUNT(*) FROM members WHERE status='ACTIVE'")->fetchColumn();
    $stmt = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM contributions WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())");
    $stmt->execute();
    $contributionsThisMonth = $stmt->fetchColumn();
    $pendingFollowUps = $db->query("SELECT COUNT(*) FROM follow_ups WHERE status='PENDING'")->fetchColumn();
    $totalVolunteers = $db->query("SELECT COUNT(*) FROM volunteer_assignments WHERE is_active=1")->fetchColumn();
    $totalBranches = $db->query("SELECT COUNT(*) FROM branches")->fetchColumn();
} else {
    $stmt = $db->prepare("SELECT COUNT(*) FROM members WHERE branch_id = ?");
    $stmt->execute([$branchId]);
    $totalMembers = $stmt->fetchColumn();

    $stmt = $db->prepare("SELECT COUNT(*) FROM members WHERE branch_id = ? AND status='ACTIVE'");
    $stmt->execute([$branchId]);
    $activeMembers = $stmt->fetchColumn();

    $stmt = $db->prepare("SELECT COALESCE(SUM(amount),0) FROM contributions WHERE branch_id = ? AND MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())");
    $stmt->execute([$branchId]);
    $contributionsThisMonth = $stmt->fetchColumn();

    $stmt = $db->prepare("SELECT COUNT(*) FROM follow_ups WHERE branch_id = ? AND status='PENDING'");
    $stmt->execute([$branchId]);
    $pendingFollowUps = $stmt->fetchColumn();

    $stmt = $db->prepare("SELECT COUNT(*) FROM volunteer_assignments WHERE branch_id = ? AND is_active=1");
    $stmt->execute([$branchId]);
    $totalVolunteers = $stmt->fetchColumn();

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
