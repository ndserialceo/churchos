<?php
/**
 * ChurchOS Database Seeder
 * 
 * Run this file from your browser after importing schema.sql:
 * http://localhost/churchos/sql/seed.php
 */

require_once __DIR__ . '/../config.php';

$db = getDB();

echo "<h1>ChurchOS Database Seeder</h1>";
echo "<pre>";

// Check if already seeded
$check = $db->query("SELECT COUNT(*) FROM users")->fetchColumn();
if ($check > 0) {
    echo "Database already has users. Skipping seed.\n";
    echo "If you want to re-seed, truncate all tables first.\n";
    exit;
}

// Branches already inserted by schema.sql
echo "✓ Branches already in database\n";

// Create users with proper password hashes
$password = password_hash('Admin123!', PASSWORD_DEFAULT);

$stmt = $db->prepare("INSERT INTO users (email, password, first_name, last_name, role, branch_id) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute(['admin@churchos.org', $password, 'Super', 'Admin', 'SUPER_ADMIN', 1]);
echo "✓ Created Super Admin: admin@churchos.org / Admin123!\n";

$stmt->execute(['lagos@churchos.org', $password, 'Lagos', 'Admin', 'BRANCH_ADMIN', 2]);
echo "✓ Created Branch Admin: lagos@churchos.org / Admin123!\n";

// Members (if not already inserted)
$memberCount = $db->query("SELECT COUNT(*) FROM members")->fetchColumn();
if ($memberCount == 0) {
    $db->exec("INSERT INTO members (first_name, last_name, phone, gender, status, branch_id) VALUES ('John', 'Doe', '+2348011111111', 'Male', 'ACTIVE', 2)");
    $db->exec("INSERT INTO members (first_name, last_name, phone, gender, status, branch_id) VALUES ('Jane', 'Smith', '+2348022222222', 'Female', 'ACTIVE', 2)");
    echo "✓ Sample members created\n";
}

// Contribution
$contribCount = $db->query("SELECT COUNT(*) FROM contributions")->fetchColumn();
if ($contribCount == 0) {
    $db->exec("INSERT INTO contributions (type, amount, date, member_id, branch_id, recorded_by) VALUES ('TITHE', 50000.00, CURDATE(), 1, 2, 1)");
    echo "✓ Sample contribution created\n";
}

// Volunteer Roles
$roleCount = $db->query("SELECT COUNT(*) FROM volunteer_roles")->fetchColumn();
if ($roleCount == 0) {
    $db->exec("INSERT INTO volunteer_roles (name, description, branch_id) VALUES ('Choir', 'Music and worship team', 2)");
    $db->exec("INSERT INTO volunteer_roles (name, description, branch_id) VALUES ('Ushering', 'Hospitality and ushering team', 2)");
    echo "✓ Volunteer roles created\n";
}

echo "\n✅ Seeding complete!\n";
echo "\nLogin credentials:\n";
echo "  Super Admin: admin@churchos.org / Admin123!\n";
echo "  Branch Admin: lagos@churchos.org / Admin123!\n";
echo "</pre>";