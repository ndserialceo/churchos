import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        branchId: true,
        branch: { select: { id: true, name: true, code: true } },
      },
    })

    if (!user) return errorResponse("User not found", 404)

    return successResponse(user)
  } catch (error) {
    return handleApiError(error)
  }
}
