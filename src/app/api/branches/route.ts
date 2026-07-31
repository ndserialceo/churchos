import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, requireRole, logAudit } from "@/lib/auth"
import { validateRequest, branchSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    requireAuth(request)

    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    })

    const branchesWithCount = branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      state: branch.state,
      phone: branch.phone,
      email: branch.email,
      memberCount: branch._count.members,
      createdAt: branch.createdAt,
      updatedAt: branch.updatedAt,
    }))

    return successResponse(branchesWithCount)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, ["SUPER_ADMIN"])

    const body = await request.json()
    const validation = validateRequest(branchSchema, body)
    if (!validation.success) return errorResponse(validation.error)

    const existingBranch = await prisma.branch.findUnique({
      where: { code: validation.data.code },
    })

    if (existingBranch) {
      return errorResponse("Branch with this code already exists", 409)
    }

    const branch = await prisma.branch.create({
      data: validation.data,
    })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "CREATE",
      entity: "Branch",
      entityId: branch.id,
      newValues: { name: branch.name, code: branch.code },
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse(branch, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
