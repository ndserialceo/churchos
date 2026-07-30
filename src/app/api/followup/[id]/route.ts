import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request)
    const { id } = await params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.notes) data.notes = body.notes
    if (body.status === "COMPLETED") data.completedAt = new Date()

    const followUp = await prisma.followUp.update({
      where: { id },
      data,
    })

    return successResponse(followUp)
  } catch (error) {
    return handleApiError(error)
  }
}