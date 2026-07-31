-- ChurchOS Database Schema for MySQL/MariaDB (XAMPP)
-- 
-- Instructions:
-- 1. Open phpMyAdmin (http://localhost/phpmyadmin)
-- 2. Create a new database named 'churchos'
-- 3. Import this file
-- 4. Visit http://localhost/churchos/sql/seed.php to seed data
--    OR run the INSERT statements at the bottom manually

CREATE DATABASE IF NOT EXISTS churchos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE churchos;

-- Branches
CREATE TABLE branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Users
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    role ENUM('SUPER_ADMIN','BRANCH_ADMIN','PASTOR','SECRETARY','TREASURER') NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    branch_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_users_branch (branch_id),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
) ENGINE=InnoDB;

-- Members
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    occupation VARCHAR(100),
    marital_status VARCHAR(50),
    anniversary_date DATE,
    photo_url VARCHAR(500),
    status ENUM('ACTIVE','INACTIVE','TRANSFERRED','DECEASED') DEFAULT 'ACTIVE',
    joined_date DATE,
    notes TEXT,
    branch_id INT NOT NULL,
    family_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_members_branch (branch_id),
    INDEX idx_members_status (status),
    INDEX idx_members_family (family_id),
    INDEX idx_members_email (email),
    INDEX idx_members_phone (phone),
    INDEX idx_members_name (last_name, first_name)
) ENGINE=InnoDB;

-- Families
CREATE TABLE families (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    branch_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Contributions
CREATE TABLE contributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('TITHE','OFFERING','PLEDGE','SPECIAL_DONATION') NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'NGN',
    date DATE NOT NULL,
    notes TEXT,
    member_id INT NOT NULL,
    branch_id INT NOT NULL,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_contributions_member (member_id),
    INDEX idx_contributions_branch (branch_id),
    INDEX idx_contributions_date (date),
    INDEX idx_contributions_type (type),
    INDEX idx_contributions_recorded_by (recorded_by)
) ENGINE=InnoDB;

-- Expenses
CREATE TABLE expenses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'NGN',
    date DATE NOT NULL,
    receipt_url VARCHAR(500),
    notes TEXT,
    branch_id INT NOT NULL,
    approved_by INT NULL,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_expenses_branch (branch_id),
    INDEX idx_expenses_date (date),
    INDEX idx_expenses_category (category),
    INDEX idx_expenses_recorded_by (recorded_by)
) ENGINE=InnoDB;

-- Attendance
CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    service VARCHAR(100) NOT NULL,
    member_id INT NOT NULL,
    branch_id INT NOT NULL,
    recorded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uk_attendance (member_id, date, service),
    INDEX idx_attendance_branch (branch_id),
    INDEX idx_attendance_date (date),
    INDEX idx_attendance_recorded_by (recorded_by)
) ENGINE=InnoDB;

-- Visitations
CREATE TABLE visitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visit_date DATETIME NOT NULL,
    type VARCHAR(100),
    notes TEXT,
    outcome TEXT,
    member_id INT NOT NULL,
    visited_by INT NOT NULL,
    branch_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (visited_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_visitations_member (member_id),
    INDEX idx_visitations_branch (branch_id),
    INDEX idx_visitations_date (visit_date)
) ENGINE=InnoDB;

-- Follow Ups
CREATE TABLE follow_ups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    assigned_to INT,
    member_id INT NOT NULL,
    branch_id INT NOT NULL,
    due_date DATE,
    completed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_followups_status (status),
    INDEX idx_followups_assigned (assigned_to),
    INDEX idx_followups_member (member_id),
    INDEX idx_followups_branch (branch_id),
    INDEX idx_followups_due_date (due_date)
) ENGINE=InnoDB;

-- Volunteer Roles
CREATE TABLE volunteer_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    branch_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_volunteer_roles_branch (branch_id)
) ENGINE=InnoDB;

-- Volunteer Assignments
CREATE TABLE volunteer_assignments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    role_id INT NOT NULL,
    branch_id INT NOT NULL,
    start_date DATE,
    end_date DATE NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (role_id) REFERENCES volunteer_roles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    UNIQUE KEY uk_volunteer (member_id, role_id),
    INDEX idx_volunteer_assign_branch (branch_id),
    INDEX idx_volunteer_assign_active (is_active)
) ENGINE=InnoDB;

-- Communications
CREATE TABLE communications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type ENUM('SMS','WHATSAPP','EMAIL') NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status ENUM('PENDING','SENT','FAILED') DEFAULT 'PENDING',
    sent_at DATETIME NULL,
    error_log TEXT,
    member_id INT NULL,
    branch_id INT NOT NULL,
    sent_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (sent_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_communications_status (status),
    INDEX idx_communications_branch (branch_id),
    INDEX idx_communications_member (member_id),
    INDEX idx_communications_type (type)
) ENGINE=InnoDB;

-- Announcements
CREATE TABLE announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'NORMAL',
    target_branch_id INT NULL,
    created_by INT NOT NULL,
    branch_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (target_branch_id) REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_announcements_branch (branch_id),
    INDEX idx_announcements_priority (priority)
) ENGINE=InnoDB;

-- Audit Logs (for parity with Next.js stack)
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    branch_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_branch (branch_id),
    INDEX idx_audit_entity (entity, entity_id),
    INDEX idx_audit_created (created_at)
) ENGINE=InnoDB;

-- Seed Branches
INSERT INTO branches (name, code, city, state) VALUES
('Headquarters', 'HQ001', 'Lagos', 'Lagos'),
('Lagos Main Parish', 'LAG001', 'Lagos', 'Lagos');

-- Note: Users and other seed data are created by running sql/seed.php
-- This generates proper bcrypt password hashes at runtime.
