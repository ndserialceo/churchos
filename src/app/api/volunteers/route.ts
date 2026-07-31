import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logAudit } from "@/lib/auth"
import { validateRequest, volunteerRoleSchema, volunteerAssignmentSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)

    const [roles, members] = await Promise.all([
      prisma.volunteerRole.findMany({
        where: { branchId: auth.branchId },
        include: {
          assignments: {
            where: { isActive: true },
            include: { member: { select: { id: true, firstName: true, lastName: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.member.findMany({
        where: { branchId: auth.branchId, status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true },
        orderBy: { firstName: "asc" },
      }),
    ])

    const assignments = await prisma.volunteerAssignment.findMany({
      where: { branchId: auth.branchId },
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        role: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return successResponse({ roles, assignments, members })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const body = await request.json()

    if (action === "role") {
      const validation = validateRequest(volunteerRoleSchema, body)
      if (!validation.success) return errorResponse(validation.error)

      const role = await prisma.volunteerRole.create({
        data: { ...validation.data, branchId: auth.branchId },
      })

      const forwarded = request.headers.get("x-forwarded-for")
      await logAudit({
        userId: auth.userId,
        branchId: auth.branchId,
        action: "CREATE",
        entity: "VolunteerRole",
        entityId: role.id,
        newValues: validation.data as Record<string, unknown>,
        ipAddress: forwarded?.split(",")[0]?.trim(),
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return successResponse(role, 201)
    }

    if (action === "assign") {
      const validation = validateRequest(volunteerAssignmentSchema, body)
      if (!validation.success) return errorResponse(validation.error)

      const assignment = await prisma.volunteerAssignment.create({
        data: {
          memberId: validation.data.memberId,
          roleId: validation.data.roleId,
          branchId: auth.branchId,
          startDate: validation.data.startDate ? new Date(validation.data.startDate) : new Date(),
          endDate: validation.data.endDate ? new Date(validation.data.endDate) : null,
        },
      })

      const forwarded = request.headers.get("x-forwarded-for")
      await logAudit({
        userId: auth.userId,
        branchId: auth.branchId,
        action: "CREATE",
        entity: "VolunteerAssignment",
        entityId: assignment.id,
        newValues: validation.data as Record<string, unknown>,
        ipAddress: forwarded?.split(",")[0]?.trim(),
        userAgent: request.headers.get("user-agent") || undefined,
      })

      return successResponse(assignment, 201)
    }

    return errorResponse("Invalid action. Use ?action=role or ?action=assign", 400)
  } catch (error) {
    return handleApiError(error)
  }
}
