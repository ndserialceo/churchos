<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
requireRole(['SUPER_ADMIN']);

$db = getDB();
$success = $_GET['success'] ?? '';
$error = $_GET['error'] ?? '';

$branches = $db->query("
    SELECT b.*,
        (SELECT COUNT(*) FROM members WHERE branch_id = b.id) AS member_count,
        (SELECT COUNT(*) FROM users WHERE branch_id = b.id) AS staff_count,
        (SELECT COUNT(*) FROM contributions WHERE branch_id = b.id) AS contribution_count
    FROM branches b ORDER BY b.name
")->fetchAll();
?>
<?php if ($success): ?>
    <div class="alert alert-success alert-dismissible fade show"><?= htmlspecialchars($success) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>
<?php if ($error): ?>
    <div class="alert alert-danger alert-dismissible fade show"><?= htmlspecialchars($error) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>

<h4 class="mb-4">Branch Oversight</h4>

<div class="card shadow-sm mb-4">
    <div class="card-header bg-white"><h5 class="mb-0">+ Add Branch</h5></div>
    <div class="card-body">
        <form method="POST" action="api/branches.php">
            <div class="row g-3">
                <div class="col-md-4">
                    <label class="form-label">Name</label>
                    <input type="text" name="name" class="form-control" required>
                </div>
                <div class="col-md-2">
                    <label class="form-label">Code</label>
                    <input type="text" name="code" class="form-control" required placeholder="e.g. LAG001">
                </div>
                <div class="col-md-6">
                    <label class="form-label">Address</label>
                    <input type="text" name="address" class="form-control">
                </div>
                <div class="col-md-4">
                    <label class="form-label">City</label>
                    <input type="text" name="city" class="form-control">
                </div>
                <div class="col-md-2">
                    <label class="form-label">State</label>
                    <input type="text" name="state" class="form-control">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Phone</label>
                    <input type="text" name="phone" class="form-control">
                </div>
                <div class="col-md-3">
                    <label class="form-label">Email</label>
                    <input type="email" name="email" class="form-control">
                </div>
                <div class="col-12">
                    <button type="submit" class="btn btn-primary">Add Branch</button>
                </div>
            </div>
        </form>
    </div>
</div>

<div class="row g-4">
    <?php foreach ($branches as $b): ?>
        <div class="col-md-6 col-lg-4">
            <div class="card shadow-sm h-100">
                <div class="card-body">
                    <h5 class="card-title"><?= htmlspecialchars($b['name']) ?></h5>
                    <span class="badge bg-secondary mb-2"><?= htmlspecialchars($b['code']) ?></span>
                    <p class="card-text text-muted small">
                        <?= htmlspecialchars($b['city'] ?? '') ?><?= ($b['city'] && $b['state']) ? ', ' : '' ?><?= htmlspecialchars($b['state'] ?? 'N/A') ?>
                        <?php if ($b['phone']): ?><br>Phone: <?= htmlspecialchars($b['phone']) ?><?php endif; ?>
                        <?php if ($b['email']): ?><br>Email: <?= htmlspecialchars($b['email']) ?><?php endif; ?>
                    </p>
                    <hr>
                    <div class="d-flex justify-content-between text-center">
                        <div><strong><?= $b['member_count'] ?></strong><br><small class="text-muted">Members</small></div>
                        <div><strong><?= $b['staff_count'] ?></strong><br><small class="text-muted">Staff</small></div>
                        <div><strong><?= $b['contribution_count'] ?></strong><br><small class="text-muted">Contributions</small></div>
                    </div>
                </div>
            </div>
        </div>
    <?php endforeach; ?>
    <?php if (count($branches) === 0): ?>
        <div class="col-12"><p class="text-muted text-center">No branches yet.</p></div>
    <?php endif; ?>
</div>