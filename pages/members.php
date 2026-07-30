<?php
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDB();
$user = getCurrentUser();
$isSuperAdmin = $_SESSION['role'] === 'SUPER_ADMIN';
$branchId = getBranchId();
$search = $_GET['search'] ?? '';

if ($isSuperAdmin) {
    $sql = "SELECT m.*, b.name as branch_name FROM members m JOIN branches b ON m.branch_id = b.id WHERE 1=1";
    $params = [];
} else {
    $sql = "SELECT m.*, b.name as branch_name FROM members m JOIN branches b ON m.branch_id = b.id WHERE m.branch_id = ?";
    $params = [$branchId];
}

if ($search !== '') {
    $sql .= " AND (m.first_name LIKE ? OR m.last_name LIKE ? OR m.phone LIKE ? OR m.email LIKE ?)";
    $like = "%$search%";
    $params = array_merge($params, [$like, $like, $like, $like]);
}

$sql .= " ORDER BY m.last_name ASC, m.first_name ASC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$members = $stmt->fetchAll();

$success = $_GET['success'] ?? '';
$error = $_GET['error'] ?? '';
?>

<?php if ($success): ?>
    <div class="alert alert-success alert-dismissible fade show"><?= htmlspecialchars($success) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>
<?php if ($error): ?>
    <div class="alert alert-danger alert-dismissible fade show"><?= htmlspecialchars($error) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>

<div class="d-flex justify-content-between align-items-center mb-3">
    <h4 class="mb-0">Members</h4>
    <a href="index.php?page=members_add" class="btn btn-primary"><i class="bi bi-plus-lg"></i> Add Member</a>
</div>

<form method="GET" action="index.php" class="row g-2 mb-3">
    <input type="hidden" name="page" value="members">
    <div class="col-auto flex-grow-1">
        <input type="text" name="search" class="form-control" placeholder="Search by name, phone or email..." value="<?= htmlspecialchars($search) ?>">
    </div>
    <div class="col-auto">
        <button type="submit" class="btn btn-outline-secondary"><i class="bi bi-search"></i> Search</button>
        <?php if ($search !== ''): ?>
            <a href="index.php?page=members" class="btn btn-outline-secondary">Clear</a>
        <?php endif; ?>
    </div>
</form>

<div class="table-responsive">
    <table class="table table-hover align-middle">
        <thead class="table-light">
            <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Gender</th>
                <th>City</th>
                <th>Status</th>
                <?php if ($isSuperAdmin): ?><th>Branch</th><?php endif; ?>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php if (count($members) === 0): ?>
                <tr><td colspan="<?= $isSuperAdmin ? 8 : 7 ?>" class="text-center text-muted py-4">No members found.</td></tr>
            <?php endif; ?>
            <?php foreach ($members as $m): ?>
                <tr>
                    <td><?= htmlspecialchars($m['last_name'] . ', ' . $m['first_name']) ?></td>
                    <td><?= htmlspecialchars($m['phone'] ?? '') ?></td>
                    <td><?= htmlspecialchars($m['email'] ?? '') ?></td>
                    <td><?= htmlspecialchars($m['gender'] ?? '') ?></td>
                    <td><?= htmlspecialchars($m['city'] ?? '') ?></td>
                    <td>
                        <?php
                        $badgeClass = match ($m['status']) {
                            'ACTIVE'     => 'bg-success',
                            'INACTIVE'   => 'bg-warning text-dark',
                            'TRANSFERRED'=> 'bg-info text-dark',
                            'DECEASED'   => 'bg-secondary',
                            default      => 'bg-light text-dark'
                        };
                        ?>
                        <span class="badge <?= $badgeClass ?>"><?= htmlspecialchars($m['status']) ?></span>
                    </td>
                    <?php if ($isSuperAdmin): ?><td><?= htmlspecialchars($m['branch_name']) ?></td><?php endif; ?>
                    <td>
                        <a href="index.php?page=members_edit&id=<?= $m['id'] ?>" class="btn btn-sm btn-outline-primary me-1" title="Edit"><i class="bi bi-pencil"></i></a>
                        <a href="api/members.php?action=delete&id=<?= $m['id'] ?>" class="btn btn-sm btn-outline-danger" title="Delete" onclick="return confirm('Are you sure you want to delete this member?')"><i class="bi bi-trash"></i></a>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>
