import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { clearAuthCookies } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get("cs_refresh")?.value
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true },
      })
    }

    await clearAuthCookies()

    return successResponse({ message: "Logged out" })
  } catch (error) {
    return handleApiError(error)
  }
}
