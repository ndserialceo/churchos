import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logAudit } from "@/lib/auth"
import { validateRequest, contributionSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || ""
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { branchId: auth.branchId }
    if (type) where.type = type

    const [contributions, total] = await Promise.all([
      prisma.contribution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: { member: { select: { firstName: true, lastName: true } } },
      }),
      prisma.contribution.count({ where }),
    ])

    return successResponse({ contributions, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const body = await request.json()
    const validation = validateRequest(contributionSchema, body)
    if (!validation.success) return errorResponse(validation.error)

    const contribution = await prisma.contribution.create({
      data: { ...validation.data, branchId: auth.branchId, recordedById: auth.userId },
    })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "CREATE",
      entity: "Contribution",
      entityId: contribution.id,
      newValues: validation.data as Record<string, unknown>,
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse(contribution, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
