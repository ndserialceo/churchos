import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const branchId = auth.branchId
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())

    const [
      totalMembers,
      activeMembers,
      newThisMonth,
      totalContributions,
      totalExpenses,
      pendingFollowUps,
      thisWeekAttendance,
      recentContributions,
    ] = await Promise.all([
      prisma.member.count({ where: { branchId } }),
      prisma.member.count({ where: { branchId, status: "ACTIVE" } }),
      prisma.member.count({ where: { branchId, createdAt: { gte: startOfMonth } } }),
      prisma.contribution.aggregate({
        where: { branchId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { branchId, date: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.followUp.count({ where: { branchId, status: "PENDING" } }),
      prisma.attendance.count({
        where: { branchId, date: { gte: startOfWeek } },
      }),
      prisma.contribution.findMany({
        where: { branchId },
        orderBy: { date: "desc" },
        take: 10,
        include: { member: { select: { firstName: true, lastName: true } } },
      }),
    ])

    return successResponse({
      totalMembers,
      activeMembers,
      newThisMonth,
      totalContributions: Number(totalContributions._sum.amount) || 0,
      totalExpenses: Number(totalExpenses._sum.amount) || 0,
      pendingFollowUps,
      thisWeekAttendance,
      recentContributions: recentContributions.map((c) => ({
        ...c,
        amount: Number(c.amount),
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
