import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireRole, hashPassword, logAudit } from "@/lib/auth"
import { validateRequest, registerSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = requireRole(request, ["SUPER_ADMIN", "BRANCH_ADMIN"])

    const users = await prisma.user.findMany({
      where: { branchId: auth.branchId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return successResponse(users)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireRole(request, ["SUPER_ADMIN", "BRANCH_ADMIN"])

    const body = await request.json()
    const validation = validateRequest(registerSchema, body)
    if (!validation.success) return errorResponse(validation.error)

    const existingUser = await prisma.user.findUnique({
      where: { email: validation.data.email },
    })
    if (existingUser) return errorResponse("A user with this email already exists")

    const hashedPassword = await hashPassword(validation.data.password)

    const user = await prisma.user.create({
      data: {
        email: validation.data.email,
        password: hashedPassword,
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        phone: validation.data.phone,
        role: validation.data.role,
        branchId: auth.branchId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        branch: { select: { id: true, name: true } },
      },
    })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      newValues: validation.data as Record<string, unknown>,
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse(user, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
