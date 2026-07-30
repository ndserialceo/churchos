<?php
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDB();
$isSuperAdmin = $_SESSION['role'] === 'SUPER_ADMIN';
$branchId = getBranchId();

$branchFilter = $isSuperAdmin ? '' : ' AND branch_id = ?';
$branchParams = $isSuperAdmin ? [] : [$branchId];

// Summary
$incomeSql = "SELECT COALESCE(SUM(amount), 0) as total FROM contributions WHERE MONTH(date) = MONTH(CURRENT_DATE) AND YEAR(date) = YEAR(CURRENT_DATE)$branchFilter";
$stmt = $db->prepare($incomeSql);
$stmt->execute($branchParams);
$incomeThisMonth = $stmt->fetch()['total'];

$expenseSql = "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE MONTH(date) = MONTH(CURRENT_DATE) AND YEAR(date) = YEAR(CURRENT_DATE)$branchFilter";
$stmt = $db->prepare($expenseSql);
$stmt->execute($branchParams);
$expensesThisMonth = $stmt->fetch()['total'];

$balance = $incomeThisMonth - $expensesThisMonth;

// Contributions
$contribSql = "SELECT c.*, CONCAT(m.first_name, ' ', m.last_name) as member_name, b.name as branch_name FROM contributions c JOIN members m ON c.member_id = m.id JOIN branches b ON c.branch_id = b.id WHERE 1=1$branchFilter ORDER BY c.date DESC";
$stmt = $db->prepare($contribSql);
$stmt->execute($branchParams);
$contributions = $stmt->fetchAll();

// Expenses
$expSql = "SELECT e.*, b.name as branch_name FROM expenses e JOIN branches b ON e.branch_id = b.id WHERE 1=1$branchFilter ORDER BY e.date DESC";
$stmt = $db->prepare($expSql);
$stmt->execute($branchParams);
$expenses = $stmt->fetchAll();

// Members dropdown (for contribution form)
$membersSql = $isSuperAdmin ? "SELECT id, first_name, last_name FROM members ORDER BY last_name, first_name" : "SELECT id, first_name, last_name FROM members WHERE branch_id = ? ORDER BY last_name, first_name";
$stmt = $db->prepare($membersSql);
$stmt->execute($isSuperAdmin ? [] : [$branchId]);
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

<h4 class="mb-3">Finance</h4>

<div class="row g-3 mb-4">
    <div class="col-md-4">
        <div class="card border-success">
            <div class="card-body">
                <h6 class="card-title text-muted">Income This Month</h6>
                <h3 class="text-success mb-0">₦<?= number_format($incomeThisMonth, 2) ?></h3>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card border-danger">
            <div class="card-body">
                <h6 class="card-title text-muted">Expenses This Month</h6>
                <h3 class="text-danger mb-0">₦<?= number_format($expensesThisMonth, 2) ?></h3>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card border-<?= $balance >= 0 ? 'primary' : 'warning' ?>">
            <div class="card-body">
                <h6 class="card-title text-muted">Balance</h6>
                <h3 class="<?= $balance >= 0 ? 'text-primary' : 'text-warning' ?> mb-0">₦<?= number_format($balance, 2) ?></h3>
            </div>
        </div>
    </div>
</div>

<ul class="nav nav-tabs mb-3" id="financeTabs" role="tablist">
    <li class="nav-item" role="presentation">
        <button class="nav-link active" id="contributions-tab" data-bs-toggle="tab" data-bs-target="#contributions" type="button" role="tab">Contributions</button>
    </li>
    <li class="nav-item" role="presentation">
        <button class="nav-link" id="expenses-tab" data-bs-toggle="tab" data-bs-target="#expenses" type="button" role="tab">Expenses</button>
    </li>
</ul>

<div class="tab-content" id="financeTabsContent">
    <!-- Contributions Tab -->
    <div class="tab-pane fade show active" id="contributions" role="tabpanel">
        <div class="d-flex justify-content-end mb-2">
            <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addContributionModal"><i class="bi bi-plus-lg"></i> Add Contribution</button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Member</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Notes</th>
                        <?php if ($isSuperAdmin): ?><th>Branch</th><?php endif; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php if (count($contributions) === 0): ?>
                        <tr><td colspan="<?= $isSuperAdmin ? 6 : 5 ?>" class="text-center text-muted py-4">No contributions found.</td></tr>
                    <?php endif; ?>
                    <?php foreach ($contributions as $c): ?>
                        <tr>
                            <td><?= htmlspecialchars($c['member_name']) ?></td>
                            <td><span class="badge bg-secondary"><?= htmlspecialchars($c['type']) ?></span></td>
                            <td>₦<?= number_format($c['amount'], 2) ?></td>
                            <td><?= htmlspecialchars($c['date']) ?></td>
                            <td><?= htmlspecialchars($c['notes'] ?? '') ?></td>
                            <?php if ($isSuperAdmin): ?><td><?= htmlspecialchars($c['branch_name']) ?></td><?php endif; ?>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Expenses Tab -->
    <div class="tab-pane fade" id="expenses" role="tabpanel">
        <div class="d-flex justify-content-end mb-2">
            <button class="btn btn-primary btn-sm" data-bs-toggle="modal" data-bs-target="#addExpenseModal"><i class="bi bi-plus-lg"></i> Add Expense</button>
        </div>
        <div class="table-responsive">
            <table class="table table-hover align-middle">
                <thead class="table-light">
                    <tr>
                        <th>Description</th>
                        <th>Category</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Notes</th>
                        <?php if ($isSuperAdmin): ?><th>Branch</th><?php endif; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php if (count($expenses) === 0): ?>
                        <tr><td colspan="<?= $isSuperAdmin ? 6 : 5 ?>" class="text-center text-muted py-4">No expenses found.</td></tr>
                    <?php endif; ?>
                    <?php foreach ($expenses as $e): ?>
                        <tr>
                            <td><?= htmlspecialchars($e['description']) ?></td>
                            <td><?= htmlspecialchars($e['category'] ?? '') ?></td>
                            <td>₦<?= number_format($e['amount'], 2) ?></td>
                            <td><?= htmlspecialchars($e['date']) ?></td>
                            <td><?= htmlspecialchars($e['notes'] ?? '') ?></td>
                            <?php if ($isSuperAdmin): ?><td><?= htmlspecialchars($e['branch_name']) ?></td><?php endif; ?>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add Contribution Modal -->
<div class="modal fade" id="addContributionModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST" action="api/contributions.php">
                <div class="modal-header">
                    <h5 class="modal-title">Add Contribution</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Member <span class="text-danger">*</span></label>
                        <select name="member_id" class="form-select" required>
                            <option value="">-- Select Member --</option>
                            <?php foreach ($members as $m): ?>
                                <option value="<?= $m['id'] ?>"><?= htmlspecialchars($m['last_name'] . ', ' . $m['first_name']) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Type <span class="text-danger">*</span></label>
                        <select name="type" class="form-select" required>
                            <option value="">-- Select --</option>
                            <option value="TITHE">Tithe</option>
                            <option value="OFFERING">Offering</option>
                            <option value="PLEDGE">Pledge</option>
                            <option value="SPECIAL_DONATION">Special Donation</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Amount <span class="text-danger">*</span></label>
                        <input type="number" step="0.01" name="amount" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Date <span class="text-danger">*</span></label>
                        <input type="date" name="date" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Notes</label>
                        <textarea name="notes" class="form-control" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Contribution</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Add Expense Modal -->
<div class="modal fade" id="addExpenseModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <form method="POST" action="api/expenses.php">
                <div class="modal-header">
                    <h5 class="modal-title">Add Expense</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label">Description <span class="text-danger">*</span></label>
                        <input type="text" name="description" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Category</label>
                        <select name="category" class="form-select">
                            <option value="">-- Select --</option>
                            <option value="Utilities">Utilities</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Salaries">Salaries</option>
                            <option value="Outreach">Outreach</option>
                            <option value="Events">Events</option>
                            <option value="Supplies">Supplies</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Amount <span class="text-danger">*</span></label>
                        <input type="number" step="0.01" name="amount" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Date <span class="text-danger">*</span></label>
                        <input type="date" name="date" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Notes</label>
                        <textarea name="notes" class="form-control" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Expense</button>
                </div>
            </form>
        </div>
    </div>
</div>
