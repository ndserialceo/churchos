import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, signToken } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-utils"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return errorResponse("Email and password are required")
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { branch: true },
    })

    if (!user || !user.isActive) {
      return errorResponse("Invalid credentials", 401)
    }

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      return errorResponse("Invalid credentials", 401)
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
    })

    const response = successResponse({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branch: {
          id: user.branch.id,
          name: user.branch.name,
          code: user.branch.code,
        },
      },
    })

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    })

    return response
  } catch (error) {
    return errorResponse("Login failed", 500)
  }
}