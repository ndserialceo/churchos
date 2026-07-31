import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logAudit } from "@/lib/auth"
import { validateRequest, followUpSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { branchId: auth.branchId }
    if (status) where.status = status

    const [followUps, total] = await Promise.all([
      prisma.followUp.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.followUp.count({ where }),
    ])

    return successResponse({ followUps, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const body = await request.json()
    const validation = validateRequest(followUpSchema, body)
    if (!validation.success) return errorResponse(validation.error)

    const followUp = await prisma.followUp.create({
      data: {
        ...validation.data,
        status: "PENDING",
        branchId: auth.branchId,
        dueDate: validation.data.dueDate ? new Date(validation.data.dueDate) : null,
      },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "CREATE",
      entity: "FollowUp",
      entityId: followUp.id,
      newValues: validation.data as Record<string, unknown>,
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse(followUp, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
