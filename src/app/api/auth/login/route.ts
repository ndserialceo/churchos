import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  verifyPassword,
  signAccessToken,
  createRefreshToken,
  getCsrfToken,
  getCookieOptions,
  getCsrfCookieOptions,
  logAudit,
} from "@/lib/auth"
import { validateRequest, loginSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validation = validateRequest(loginSchema, body)
    if (!validation.success) return errorResponse(validation.error)

    const { email, password } = validation.data
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !user.isActive) {
      return errorResponse("Invalid email or password", 401)
    }

    const valid = await verifyPassword(password, user.password)
    if (!valid) {
      return errorResponse("Invalid email or password", 401)
    }

    const payload = { userId: user.id, email: user.email, role: user.role, branchId: user.branchId }
    const accessToken = signAccessToken(payload)
    const refreshToken = await createRefreshToken(user.id)
    const csrfToken = getCsrfToken()

    const cookieStore = await cookies()
    cookieStore.set("cs_access", accessToken, getCookieOptions(15 * 60))
    cookieStore.set("cs_refresh", refreshToken, getCookieOptions(7 * 24 * 60 * 60))
    cookieStore.set("cs_csrf", csrfToken, getCsrfCookieOptions(7 * 24 * 60 * 60))

    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded?.split(",")[0]?.trim() || "unknown"

    await logAudit({
      userId: user.id,
      branchId: user.branchId,
      action: "LOGIN",
      entity: "User",
      entityId: user.id,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
