<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDB();
$branchId = getBranchId();
$success = $_GET['success'] ?? '';
$error = $_GET['error'] ?? '';

$membersList = $db->prepare("SELECT id, first_name, last_name FROM members WHERE branch_id = ? ORDER BY first_name");
$membersList->execute([$branchId]);
$membersList = $membersList->fetchAll();

$rolesList = $db->prepare("SELECT * FROM volunteer_roles WHERE branch_id = ? ORDER BY name");
$rolesList->execute([$branchId]);
$rolesList = $rolesList->fetchAll();

$assignmentsList = $db->prepare("SELECT va.*, m.first_name, m.last_name, vr.name AS role_name FROM volunteer_assignments va JOIN members m ON va.member_id = m.id JOIN volunteer_roles vr ON va.role_id = vr.id WHERE va.branch_id = ? ORDER BY va.created_at DESC");
$assignmentsList->execute([$branchId]);
$assignmentsList = $assignmentsList->fetchAll();

$roleMembers = [];
foreach ($assignmentsList as $a) {
    $roleMembers[$a['role_id']][] = $a;
}
?>
<?php if ($success): ?>
    <div class="alert alert-success alert-dismissible fade show"><?= htmlspecialchars($success) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>
<?php if ($error): ?>
    <div class="alert alert-danger alert-dismissible fade show"><?= htmlspecialchars($error) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>

<h4 class="mb-4">Volunteer Management</h4>

<div class="row g-3 mb-4">
    <div class="col-md-6">
        <div class="card shadow-sm">
            <div class="card-header bg-white"><h5 class="mb-0">+ New Role</h5></div>
            <div class="card-body">
                <form method="POST" action="api/volunteers.php">
                    <input type="hidden" name="action" value="role">
                    <div class="mb-3">
                        <label class="form-label">Name</label>
                        <input type="text" name="name" class="form-control" required placeholder="e.g. Choir, Ushering">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea name="description" class="form-control" rows="2"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Create Role</button>
                </form>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card shadow-sm">
            <div class="card-header bg-white"><h5 class="mb-0">+ Assign Member</h5></div>
            <div class="card-body">
                <form method="POST" action="api/volunteers.php">
                    <input type="hidden" name="action" value="assign">
                    <div class="mb-3">
                        <label class="form-label">Member</label>
                        <select name="member_id" class="form-select" required>
                            <option value="">-- Select --</option>
                            <?php foreach ($membersList as $m): ?>
                                <option value="<?= $m['id'] ?>"><?= htmlspecialchars($m['first_name'] . ' ' . $m['last_name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Role</label>
                        <select name="role_id" class="form-select" required>
                            <option value="">-- Select --</option>
                            <?php foreach ($rolesList as $r): ?>
                                <option value="<?= $r['id'] ?>"><?= htmlspecialchars($r['name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-success">Assign</button>
                </form>
            </div>
        </div>
    </div>
</div>

<div class="row g-4">
    <div class="col-md-6">
        <h5 class="mb-3">Ministries & Roles</h5>
        <?php if (count($rolesList) === 0): ?>
            <p class="text-muted">No roles created yet.</p>
        <?php endif; ?>
        <?php foreach ($rolesList as $role): ?>
            <div class="card shadow-sm mb-3">
                <div class="card-body">
                    <h5 class="card-title"><?= htmlspecialchars($role['name']) ?></h5>
                    <p class="card-text text-muted"><?= htmlspecialchars($role['description'] ?? 'No description') ?></p>
                    <div>
                        <?php if (isset($roleMembers[$role['id']])): ?>
                            <?php foreach ($roleMembers[$role['id']] as $ra): ?>
                                <span class="badge bg-primary me-1 mb-1"><?= htmlspecialchars($ra['first_name'] . ' ' . $ra['last_name']) ?></span>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <span class="text-muted small">No members assigned</span>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    <div class="col-md-6">
        <h5 class="mb-3">Current Assignments</h5>
        <div class="card shadow-sm">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr><th>Member</th><th>Role</th><th>Since</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            <?php if (count($assignmentsList) === 0): ?>
                                <tr><td colspan="4" class="text-center text-muted py-4">No assignments yet.</td></tr>
                            <?php endif; ?>
                            <?php foreach ($assignmentsList as $a): ?>
                                <tr>
                                    <td><?= htmlspecialchars($a['first_name'] . ' ' . $a['last_name']) ?></td>
                                    <td><?= htmlspecialchars($a['role_name']) ?></td>
                                    <td><?= $a['created_at'] ?></td>
                                    <td><span class="badge bg-<?= $a['is_active'] ? 'success' : 'secondary' ?>"><?= $a['is_active'] ? 'Active' : 'Inactive' ?></span></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>