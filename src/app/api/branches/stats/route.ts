import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)

    let branchFilter = {}
    if (user.role !== "SUPER_ADMIN") {
      branchFilter = { id: user.branchId }
    }

    const [
      totalMembers,
      activeMembers,
      contributionsThisMonth,
      pendingFollowUps,
      volunteerAssignments,
      branches,
    ] = await Promise.all([
      prisma.member.count({ where: { branch: branchFilter } }),
      prisma.member.count({ where: { branch: branchFilter, status: "ACTIVE" } }),
      prisma.contribution.aggregate({
        where: {
          branch: branchFilter,
          date: { gte: firstDay, lte: now },
        },
        _sum: { amount: true },
      }),
      prisma.followUp.count({
        where: { branch: branchFilter, status: "PENDING" },
      }),
      prisma.volunteerAssignment.count({
        where: { branch: branchFilter, isActive: true },
      }),
      prisma.branch.count({ where: branchFilter }),
    ])

    return successResponse({
      totalMembers,
      activeMembers,
      contributionsThisMonth: contributionsThisMonth._sum.amount || 0,
      pendingFollowUps,
      totalVolunteers: volunteerAssignments,
      totalBranches: branches,
    })
  } catch (error) {
    return handleApiError(error)
  }
}