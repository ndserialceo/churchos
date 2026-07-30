import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/auth"
import { successResponse, errorResponse } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  const user = getAuthenticatedUser(request)
  if (!user) {
    return errorResponse("Not authenticated", 401)
  }
  return successResponse(user)
}

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true, data: { message: "Logged out" } })
  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  })
  return response
}