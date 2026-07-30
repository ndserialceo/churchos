<?php
require_once __DIR__ . '/../includes/auth.php';
requireLogin();

$db = getDB();
$id = $_GET['id'] ?? 0;
$stmt = $db->prepare("SELECT * FROM members WHERE id = ?");
$stmt->execute([$id]);
$member = $stmt->fetch();

if (!$member) {
    echo '<div class="alert alert-danger">Member not found.</div>';
    echo '<a href="index.php?page=members" class="btn btn-outline-secondary">Back to Members</a>';
    exit;
}
?>

<h4 class="mb-3">Edit Member</h4>

<form method="POST" action="api/members.php?action=update&id=<?= $member['id'] ?>" class="row g-3">
    <div class="col-md-6">
        <label class="form-label">First Name <span class="text-danger">*</span></label>
        <input type="text" name="first_name" class="form-control" value="<?= htmlspecialchars($member['first_name']) ?>" required>
    </div>
    <div class="col-md-6">
        <label class="form-label">Last Name <span class="text-danger">*</span></label>
        <input type="text" name="last_name" class="form-control" value="<?= htmlspecialchars($member['last_name']) ?>" required>
    </div>
    <div class="col-md-6">
        <label class="form-label">Phone</label>
        <input type="text" name="phone" class="form-control" value="<?= htmlspecialchars($member['phone'] ?? '') ?>">
    </div>
    <div class="col-md-6">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control" value="<?= htmlspecialchars($member['email'] ?? '') ?>">
    </div>
    <div class="col-md-4">
        <label class="form-label">Gender</label>
        <select name="gender" class="form-select">
            <option value="">-- Select --</option>
            <option value="Male" <?= $member['gender'] === 'Male' ? 'selected' : '' ?>>Male</option>
            <option value="Female" <?= $member['gender'] === 'Female' ? 'selected' : '' ?>>Female</option>
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">City</label>
        <input type="text" name="city" class="form-control" value="<?= htmlspecialchars($member['city'] ?? '') ?>">
    </div>
    <div class="col-md-4">
        <label class="form-label">Marital Status</label>
        <select name="marital_status" class="form-select">
            <option value="">-- Select --</option>
            <option value="Single" <?= $member['marital_status'] === 'Single' ? 'selected' : '' ?>>Single</option>
            <option value="Married" <?= $member['marital_status'] === 'Married' ? 'selected' : '' ?>>Married</option>
            <option value="Divorced" <?= $member['marital_status'] === 'Divorced' ? 'selected' : '' ?>>Divorced</option>
            <option value="Widowed" <?= $member['marital_status'] === 'Widowed' ? 'selected' : '' ?>>Widowed</option>
        </select>
    </div>
    <div class="col-md-6">
        <label class="form-label">Occupation</label>
        <input type="text" name="occupation" class="form-control" value="<?= htmlspecialchars($member['occupation'] ?? '') ?>">
    </div>
    <div class="col-md-6">
        <label class="form-label">Date of Birth</label>
        <input type="date" name="date_of_birth" class="form-control" value="<?= htmlspecialchars($member['date_of_birth'] ?? '') ?>">
    </div>
    <div class="col-12">
        <label class="form-label">Address</label>
        <textarea name="address" class="form-control" rows="2"><?= htmlspecialchars($member['address'] ?? '') ?></textarea>
    </div>
    <div class="col-md-6">
        <label class="form-label">Joined Date</label>
        <input type="date" name="joined_date" class="form-control" value="<?= htmlspecialchars($member['joined_date'] ?? '') ?>">
    </div>
    <div class="col-12">
        <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Update Member</button>
        <a href="index.php?page=members" class="btn btn-outline-secondary">Cancel</a>
    </div>
</form>
