import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logAudit } from "@/lib/auth"
import { validateRequest, expenseSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where: { branchId: auth.branchId },
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          recordedBy: { select: { firstName: true, lastName: true } },
          approvedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.expense.count({ where: { branchId: auth.branchId } }),
    ])

    return successResponse({ expenses, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const body = await request.json()
    const validation = validateRequest(expenseSchema, body)
    if (!validation.success) return errorResponse(validation.error)

    const expense = await prisma.expense.create({
      data: { ...validation.data, branchId: auth.branchId, recordedById: auth.userId },
    })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
      newValues: validation.data as Record<string, unknown>,
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse(expense, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
