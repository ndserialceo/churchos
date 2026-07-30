import { NextResponse } from "next/server"

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status })
}

export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return errorResponse("Authentication required", 401)
    }
    if (error.message === "Forbidden") {
      return errorResponse("Insufficient permissions", 403)
    }
    return errorResponse(error.message, 500)
  }
  return errorResponse("An unexpected error occurred", 500)
}