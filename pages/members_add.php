<?php
require_once __DIR__ . '/../includes/auth.php';
requireLogin();
?>

<h4 class="mb-3">Add Member</h4>

<form method="POST" action="api/members.php" class="row g-3">
    <div class="col-md-6">
        <label class="form-label">First Name <span class="text-danger">*</span></label>
        <input type="text" name="first_name" class="form-control" required>
    </div>
    <div class="col-md-6">
        <label class="form-label">Last Name <span class="text-danger">*</span></label>
        <input type="text" name="last_name" class="form-control" required>
    </div>
    <div class="col-md-6">
        <label class="form-label">Phone</label>
        <input type="text" name="phone" class="form-control">
    </div>
    <div class="col-md-6">
        <label class="form-label">Email</label>
        <input type="email" name="email" class="form-control">
    </div>
    <div class="col-md-4">
        <label class="form-label">Gender</label>
        <select name="gender" class="form-select">
            <option value="">-- Select --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
        </select>
    </div>
    <div class="col-md-4">
        <label class="form-label">City</label>
        <input type="text" name="city" class="form-control">
    </div>
    <div class="col-md-4">
        <label class="form-label">Marital Status</label>
        <select name="marital_status" class="form-select">
            <option value="">-- Select --</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
        </select>
    </div>
    <div class="col-md-6">
        <label class="form-label">Occupation</label>
        <input type="text" name="occupation" class="form-control">
    </div>
    <div class="col-md-6">
        <label class="form-label">Date of Birth</label>
        <input type="date" name="date_of_birth" class="form-control">
    </div>
    <div class="col-12">
        <label class="form-label">Address</label>
        <textarea name="address" class="form-control" rows="2"></textarea>
    </div>
    <div class="col-md-6">
        <label class="form-label">Joined Date</label>
        <input type="date" name="joined_date" class="form-control">
    </div>
    <div class="col-12">
        <button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Save Member</button>
        <a href="index.php?page=members" class="btn btn-outline-secondary">Cancel</a>
    </div>
</form>
