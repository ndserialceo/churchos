import { NextRequest } from "next/server"
import { rotateRefreshToken, getCsrfToken, getCookieOptions, getCsrfCookieOptions } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("cs_refresh")?.value
    if (!refreshToken) return errorResponse("No refresh token", 401)

    const result = await rotateRefreshToken(refreshToken)
    if (!result) {
      const cookieStore = await cookies()
      cookieStore.set("cs_access", "", { ...getCookieOptions(0), maxAge: 0 })
      cookieStore.set("cs_refresh", "", { ...getCookieOptions(0), maxAge: 0 })
      cookieStore.set("cs_csrf", "", { ...getCsrfCookieOptions(0), maxAge: 0 })
      return errorResponse("Invalid refresh token", 401)
    }

    const csrfToken = getCsrfToken()
    const cookieStore = await cookies()
    cookieStore.set("cs_access", result.accessToken, getCookieOptions(15 * 60))
    cookieStore.set("cs_refresh", result.refreshToken, getCookieOptions(7 * 24 * 60 * 60))
    cookieStore.set("cs_csrf", csrfToken, getCsrfCookieOptions(7 * 24 * 60 * 60))

    return successResponse({ csrfToken })
  } catch (error) {
    return handleApiError(error)
  }
}
