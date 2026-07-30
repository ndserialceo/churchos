import { PrismaClient, UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const hqBranch = await prisma.branch.upsert({
    where: { code: "HQ001" },
    update: {},
    create: {
      name: "Headquarters",
      code: "HQ001",
      city: "Lagos",
      state: "Lagos",
      phone: "+2348000000001",
      email: "hq@church.org",
    },
  })

  const lagosBranch = await prisma.branch.upsert({
    where: { code: "LAG001" },
    update: {},
    create: {
      name: "Lagos Main Parish",
      code: "LAG001",
      city: "Lagos",
      state: "Lagos",
      phone: "+2348000000002",
      email: "lagos@church.org",
    },
  })

  const password = await bcrypt.hash("admin123", 12)

  const superAdmin = await prisma.user.upsert({
    where: { email: "admin@churchos.org" },
    update: {},
    create: {
      email: "admin@churchos.org",
      password,
      firstName: "Super",
      lastName: "Admin",
      role: UserRole.SUPER_ADMIN,
      branchId: hqBranch.id,
    },
  })

  await prisma.user.upsert({
    where: { email: "lagos@churchos.org" },
    update: {},
    create: {
      email: "lagos@churchos.org",
      password,
      firstName: "Lagos",
      lastName: "Admin",
      role: UserRole.BRANCH_ADMIN,
      branchId: lagosBranch.id,
    },
  })

  const member1 = await prisma.member.create({
    data: {
      firstName: "John",
      lastName: "Doe",
      phone: "+2348011111111",
      email: "john@example.com",
      gender: "Male",
      city: "Lagos",
      status: "ACTIVE",
      branchId: lagosBranch.id,
    },
  })

  await prisma.member.create({
    data: {
      firstName: "Jane",
      lastName: "Smith",
      phone: "+2348022222222",
      email: "jane@example.com",
      gender: "Female",
      city: "Lagos",
      status: "ACTIVE",
      branchId: lagosBranch.id,
    },
  })

  await prisma.contribution.create({
    data: {
      type: "TITHE",
      amount: 50000,
      date: new Date(),
      memberId: member1.id,
      branchId: lagosBranch.id,
      recordedById: superAdmin.id,
    },
  })

  await prisma.volunteerRole.create({
    data: {
      name: "Choir",
      description: "Music and worship team",
      branchId: lagosBranch.id,
    },
  })

  await prisma.volunteerRole.create({
    data: {
      name: "Ushering",
      description: "Hospitality and ushering team",
      branchId: lagosBranch.id,
    },
  })

  console.log("Seed completed successfully")
  console.log("Login credentials:")
  console.log("  Super Admin: admin@churchos.org / admin123")
  console.log("  Branch Admin: lagos@churchos.org / admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })