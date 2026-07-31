import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logAudit } from "@/lib/auth"
import { validateRequest, attendanceSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const service = searchParams.get("service")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { branchId: auth.branchId }

    if (startDate || endDate) {
      const dateFilter: Record<string, Date> = {}
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
      where.date = dateFilter
    }

    if (service) where.service = service

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
          recordedBy: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.attendance.count({ where }),
    ])

    return successResponse({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const body = await request.json()
    const validation = validateRequest(attendanceSchema, body)
    if (!validation.success) return errorResponse(validation.error)

    const { date, service, memberIds } = validation.data
    const attendanceDate = new Date(date)

    const existing = await prisma.attendance.findMany({
      where: {
        branchId: auth.branchId,
        date: attendanceDate,
        service,
        memberId: { in: memberIds },
      },
      select: { memberId: true },
    })

    const existingIds = new Set(existing.map((r) => r.memberId))
    const newMemberIds = memberIds.filter((id) => !existingIds.has(id))

    if (newMemberIds.length === 0) {
      return errorResponse("All selected members already have attendance recorded for this date and service")
    }

    const created = await prisma.attendance.createMany({
      data: newMemberIds.map((memberId) => ({
        date: attendanceDate,
        service,
        memberId,
        branchId: auth.branchId,
        recordedById: auth.userId,
      })),
    })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "CREATE",
      entity: "Attendance",
      newValues: {
        date,
        service,
        memberCount: created.count,
        duplicateSkipped: memberIds.length - created.count,
      },
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse(
      {
        created: created.count,
        duplicateSkipped: memberIds.length - created.count,
      },
      201
    )
  } catch (error) {
    return handleApiError(error)
  }
}
