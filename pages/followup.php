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

$usersList = $db->prepare("SELECT id, first_name, last_name FROM users WHERE branch_id = ? ORDER BY first_name");
$usersList->execute([$branchId]);
$usersList = $usersList->fetchAll();

$stmt = $db->prepare("SELECT f.*, m.first_name AS m_first, m.last_name AS m_last, u.first_name AS u_first, u.last_name AS u_last FROM follow_ups f LEFT JOIN members m ON f.member_id = m.id LEFT JOIN users u ON f.assigned_to = u.id WHERE f.branch_id = ? ORDER BY f.created_at DESC");
$stmt->execute([$branchId]);
$followUps = $stmt->fetchAll();
?>
<?php if ($success): ?>
    <div class="alert alert-success alert-dismissible fade show"><?= htmlspecialchars($success) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>
<?php if ($error): ?>
    <div class="alert alert-danger alert-dismissible fade show"><?= htmlspecialchars($error) ?><button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>
<?php endif; ?>

<h4 class="mb-4">Follow-up & Visitation</h4>

<div class="row">
    <div class="col-md-8">
        <div class="card shadow-sm">
            <div class="card-header bg-white d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Follow-ups</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr><th>Member</th><th>Type</th><th>Assigned To</th><th>Status</th><th>Due Date</th><th>Notes</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                            <?php if (count($followUps) === 0): ?>
                                <tr><td colspan="7" class="text-center text-muted py-4">No follow-ups found.</td></tr>
                            <?php endif; ?>
                            <?php foreach ($followUps as $f): ?>
                                <tr>
                                    <td><?= htmlspecialchars($f['m_first'] . ' ' . $f['m_last']) ?></td>
                                    <td><span class="badge bg-secondary"><?= htmlspecialchars($f['type']) ?></span></td>
                                    <td><?= $f['u_first'] ? htmlspecialchars($f['u_first'] . ' ' . $f['u_last']) : '-' ?></td>
                                    <td>
                                        <span class="badge bg-<?= $f['status'] === 'COMPLETED' ? 'success' : 'warning text-dark' ?>">
                                            <?= $f['status'] ?>
                                        </span>
                                    </td>
                                    <td><?= $f['due_date'] ?? '-' ?></td>
                                    <td><?= htmlspecialchars(mb_substr($f['notes'] ?? '', 0, 30)) ?></td>
                                    <td>
                                        <?php if ($f['status'] !== 'COMPLETED'): ?>
                                            <form method="POST" action="api/followup.php" style="display:inline;">
                                                <input type="hidden" name="action" value="complete">
                                                <input type="hidden" name="id" value="<?= $f['id'] ?>">
                                                <button type="submit" class="btn btn-sm btn-success">Complete</button>
                                            </form>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="col-md-4">
        <div class="card shadow-sm">
            <div class="card-header bg-white">
                <h5 class="mb-0">+ New Follow-up</h5>
            </div>
            <div class="card-body">
                <form method="POST" action="api/followup.php">
                    <div class="mb-3">
                        <label class="form-label">Type</label>
                        <select name="type" class="form-select" required>
                            <option value="NEW_CONVERT">New Convert</option>
                            <option value="VISITOR">Visitor</option>
                            <option value="PASTORAL_CARE">Pastoral Care</option>
                            <option value="DISCIPLESHIP">Discipleship</option>
                        </select>
                    </div>
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
                        <label class="form-label">Assigned To</label>
                        <select name="assigned_to" class="form-select">
                            <option value="">-- Self --</option>
                            <?php foreach ($usersList as $u): ?>
                                <option value="<?= $u['id'] ?>"><?= htmlspecialchars($u['first_name'] . ' ' . $u['last_name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Due Date</label>
                        <input type="date" name="due_date" class="form-control">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Notes</label>
                        <textarea name="notes" class="form-control" rows="3"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">Create Follow-up</button>
                </form>
            </div>
        </div>
    </div>
</div>