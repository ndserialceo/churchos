import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const [contributions, expenses, totalMembers, activeMembers] = await Promise.all([
      prisma.contribution.aggregate({
        where: { branchId, date: { gte: firstDay, lte: lastDay } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { branchId, date: { gte: firstDay, lte: lastDay } },
        _sum: { amount: true },
      }),
      prisma.member.count({ where: { branchId } }),
      prisma.member.count({ where: { branchId, status: "ACTIVE" } }),
    ])

    return successResponse({
      totalContributions: contributions._sum.amount || 0,
      totalExpenses: expenses._sum.amount || 0,
      balance: (contributions._sum.amount || 0) - (expenses._sum.amount || 0),
      totalMembers,
      activeMembers,
    })
  } catch (error) {
    return handleApiError(error)
  }
}