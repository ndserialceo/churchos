-- CreateTable
CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'BRANCH_ADMIN', 'PASTOR', 'SECRETARY', 'TREASURER');
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'DECEASED');
CREATE TYPE "ContributionType" AS ENUM ('TITHE', 'OFFERING', 'PLEDGE', 'SPECIAL_DONATION');
CREATE TYPE "CommunicationType" AS ENUM ('SMS', 'WHATSAPP', 'EMAIL');
CREATE TYPE "CommunicationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "Branch" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "code" TEXT NOT NULL,
    "address" TEXT, "city" TEXT, "state" TEXT, "phone" TEXT, "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "User" (
    "id" TEXT NOT NULL, "email" TEXT NOT NULL, "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL, "phone" TEXT,
    "role" "UserRole" NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true,
    "branchId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Member" (
    "id" TEXT NOT NULL, "firstName" TEXT NOT NULL, "lastName" TEXT NOT NULL,
    "middleName" TEXT, "dateOfBirth" TIMESTAMP(3), "gender" TEXT, "phone" TEXT,
    "email" TEXT, "address" TEXT, "city" TEXT, "state" TEXT, "occupation" TEXT,
    "maritalStatus" TEXT, "anniversaryDate" TIMESTAMP(3), "photoUrl" TEXT,
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE', "joinedDate" TIMESTAMP(3),
    "notes" TEXT, "branchId" TEXT NOT NULL, "familyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Family" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "address" TEXT, "phone" TEXT,
    "branchId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Contribution" (
    "id" TEXT NOT NULL, "type" "ContributionType" NOT NULL, "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN', "date" TIMESTAMP(3) NOT NULL, "notes" TEXT,
    "memberId" TEXT NOT NULL, "branchId" TEXT NOT NULL, "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Contribution_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL, "description" TEXT NOT NULL, "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL, "currency" TEXT NOT NULL DEFAULT 'NGN', "date" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT, "notes" TEXT, "branchId" TEXT NOT NULL, "approvedById" TEXT,
    "recordedById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Attendance" (
    "id" TEXT NOT NULL, "date" TIMESTAMP(3) NOT NULL, "service" TEXT,
    "memberId" TEXT NOT NULL, "branchId" TEXT NOT NULL, "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Visitation" (
    "id" TEXT NOT NULL, "visitDate" TIMESTAMP(3) NOT NULL, "type" TEXT NOT NULL,
    "notes" TEXT, "outcome" TEXT, "memberId" TEXT NOT NULL, "visitedById" TEXT NOT NULL,
    "branchId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Visitation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "FollowUp" (
    "id" TEXT NOT NULL, "type" TEXT NOT NULL, "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING', "assignedToId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL, "branchId" TEXT NOT NULL, "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VolunteerRole" (
    "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "VolunteerRole_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "VolunteerAssignment" (
    "id" TEXT NOT NULL, "memberId" TEXT NOT NULL, "roleId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL, "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3), "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "VolunteerAssignment_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL, "type" "CommunicationType" NOT NULL, "recipient" TEXT NOT NULL,
    "subject" TEXT, "message" TEXT NOT NULL, "status" "CommunicationStatus" NOT NULL DEFAULT 'PENDING',
    "sentAt" TIMESTAMP(3), "errorLog" TEXT, "memberId" TEXT, "branchId" TEXT NOT NULL,
    "sentById" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL, "title" TEXT NOT NULL, "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL', "targetBranchId" TEXT,
    "createdById" TEXT NOT NULL, "branchId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL, "token" TEXT NOT NULL, "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replacedBy" TEXT, "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL, "userId" TEXT, "branchId" TEXT, "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL, "entityId" TEXT, "oldValues" JSONB, "newValues" JSONB,
    "ipAddress" TEXT, "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "Member_branchId_idx" ON "Member"("branchId");
CREATE INDEX "Member_familyId_idx" ON "Member"("familyId");
CREATE INDEX "Member_status_idx" ON "Member"("status");
CREATE INDEX "Contribution_memberId_idx" ON "Contribution"("memberId");
CREATE INDEX "Contribution_branchId_idx" ON "Contribution"("branchId");
CREATE INDEX "Contribution_date_idx" ON "Contribution"("date");
CREATE INDEX "Expense_branchId_idx" ON "Expense"("branchId");
CREATE INDEX "Expense_date_idx" ON "Expense"("date");
CREATE INDEX "Attendance_branchId_idx" ON "Attendance"("branchId");
CREATE INDEX "Attendance_date_idx" ON "Attendance"("date");
CREATE UNIQUE INDEX "Attendance_memberId_date_service_key" ON "Attendance"("memberId", "date", "service");
CREATE INDEX "Visitation_memberId_idx" ON "Visitation"("memberId");
CREATE INDEX "Visitation_branchId_idx" ON "Visitation"("branchId");
CREATE INDEX "FollowUp_assignedToId_idx" ON "FollowUp"("assignedToId");
CREATE INDEX "FollowUp_memberId_idx" ON "FollowUp"("memberId");
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");
CREATE INDEX "VolunteerAssignment_branchId_idx" ON "VolunteerAssignment"("branchId");
CREATE UNIQUE INDEX "VolunteerAssignment_memberId_roleId_key" ON "VolunteerAssignment"("memberId", "roleId");
CREATE INDEX "Communication_branchId_idx" ON "Communication"("branchId");
CREATE INDEX "Communication_status_idx" ON "Communication"("status");
CREATE INDEX "Announcement_branchId_idx" ON "Announcement"("branchId");
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_branchId_idx" ON "AuditLog"("branchId");
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Member" ADD CONSTRAINT "Member_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Member" ADD CONSTRAINT "Member_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Family" ADD CONSTRAINT "Family_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contribution" ADD CONSTRAINT "Contribution_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visitation" ADD CONSTRAINT "Visitation_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visitation" ADD CONSTRAINT "Visitation_visitedById_fkey" FOREIGN KEY ("visitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Visitation" ADD CONSTRAINT "Visitation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VolunteerRole" ADD CONSTRAINT "VolunteerRole_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "VolunteerRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VolunteerAssignment" ADD CONSTRAINT "VolunteerAssignment_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_targetBranchId_fkey" FOREIGN KEY ("targetBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
