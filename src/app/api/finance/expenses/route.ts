import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const category = searchParams.get("category")

    const where: Prisma.ExpenseWhereInput = { branchId }
    if (category) where.category = category
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { recordedBy: true, approvedBy: true },
      orderBy: { date: "desc" },
    })

    return successResponse(expenses)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const body = await request.json()

    const expense = await prisma.expense.create({
      data: {
        description: body.description,
        amount: parseFloat(body.amount),
        category: body.category,
        currency: body.currency || "NGN",
        date: new Date(body.date),
        receiptUrl: body.receiptUrl,
        notes: body.notes,
        branchId,
        recordedById: user.userId,
      },
    })

    return successResponse(expense, 201)
  } catch (error) {
    return handleApiError(error)
  }
}