<?php
requireLogin();

$db = getDB();
$user = getCurrentUser();
$branchId = getBranchId();

if ($user['role'] === 'SUPER_ADMIN') {
    $totalMembers = $db->query("SELECT COUNT(*) FROM members")->fetchColumn();
    $activeMembers = $db->query("SELECT COUNT(*) FROM members WHERE status='ACTIVE'")->fetchColumn();
    $contributionsMonth = $db->query("SELECT COALESCE(SUM(amount),0) FROM contributions WHERE MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())")->fetchColumn();
    $pendingFollowUps = $db->query("SELECT COUNT(*) FROM follow_ups WHERE status='PENDING'")->fetchColumn();
    $volunteers = $db->query("SELECT COUNT(*) FROM volunteer_assignments WHERE is_active=1")->fetchColumn();
    $totalBranches = $db->query("SELECT COUNT(*) FROM branches")->fetchColumn();
} else {
    $bid = intval($branchId);
    $totalMembers = $db->query("SELECT COUNT(*) FROM members WHERE branch_id=$bid")->fetchColumn();
    $activeMembers = $db->query("SELECT COUNT(*) FROM members WHERE branch_id=$bid AND status='ACTIVE'")->fetchColumn();
    $contributionsMonth = $db->query("SELECT COALESCE(SUM(amount),0) FROM contributions WHERE branch_id=$bid AND MONTH(date)=MONTH(CURDATE()) AND YEAR(date)=YEAR(CURDATE())")->fetchColumn();
    $pendingFollowUps = $db->query("SELECT COUNT(*) FROM follow_ups WHERE branch_id=$bid AND status='PENDING'")->fetchColumn();
    $volunteers = $db->query("SELECT COUNT(*) FROM volunteer_assignments WHERE branch_id=$bid AND is_active=1")->fetchColumn();
    $totalBranches = 1;
}

$stats = [
    ['label' => 'Total Members',       'value' => $totalMembers,       'color' => 'bg-primary',   'icon' => 'bi-people'],
    ['label' => 'Active Members',      'value' => $activeMembers,      'color' => 'bg-success',   'icon' => 'bi-person-check'],
    ['label' => 'Monthly Contributions','value' => '₦' . number_format($contributionsMonth), 'color' => 'bg-warning', 'icon' => 'bi-currency-dollar'],
    ['label' => 'Pending Follow-ups',  'value' => $pendingFollowUps,   'color' => 'bg-danger',    'icon' => 'bi-bell'],
    ['label' => 'Active Volunteers',   'value' => $volunteers,         'color' => 'bg-info',      'icon' => 'bi-people-fill'],
    ['label' => 'Total Branches',      'value' => $totalBranches,      'color' => 'bg-secondary', 'icon' => 'bi-building'],
];

$quickActions = [
    ['label' => 'Add Member',    'page' => 'members_add',       'icon' => 'bi-person-plus'],
    ['label' => 'View Members',  'page' => 'members',          'icon' => 'bi-list-ul'],
    ['label' => 'Finance',       'page' => 'finance',          'icon' => 'bi-cash-coin'],
    ['label' => 'Communication', 'page' => 'communication',    'icon' => 'bi-envelope'],
    ['label' => 'Follow-ups',    'page' => 'followup',         'icon' => 'bi-calendar-check'],
    ['label' => 'Volunteers',    'page' => 'volunteers',       'icon' => 'bi-hand-thumbs-up'],
    ['label' => 'Branches',      'page' => 'branches',         'icon' => 'bi-diagram-3'],
];
?>
<h4 class="mb-4">Dashboard</h4>

<div class="row g-3 mb-4">
    <?php foreach ($stats as $s): ?>
        <div class="col-md-6 col-lg-4">
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <div class="d-flex align-items-center">
                        <div class="rounded-3 <?= $s['color'] ?> text-white d-flex align-items-center justify-content-center" style="width:56px;height:56px;font-size:1.5rem;">
                            <i class="bi <?= $s['icon'] ?>"></i>
                        </div>
                        <div class="ms-3">
                            <div class="text-muted small"><?= $s['label'] ?></div>
                            <div class="fs-4 fw-bold"><?= $s['value'] ?></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<h5 class="mb-3">Quick Actions</h5>
<div class="row g-3">
    <?php foreach ($quickActions as $a): ?>
        <div class="col-md-4 col-lg-3">
            <a href="index.php?page=<?= $a['page'] ?>" class="text-decoration-none">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-body text-center">
                        <i class="bi <?= $a['icon'] ?> fs-2 text-primary"></i>
                        <div class="mt-2"><?= $a['label'] ?></div>
                    </div>
                </div>
            </a>
        </div>
    <?php endforeach; ?>
</div>
