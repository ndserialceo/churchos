import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = { branchId }
    if (status) where.status = status

    const followUps = await prisma.followUp.findMany({
      where,
      include: { member: true, assignedTo: true },
      orderBy: { createdAt: "desc" },
    })

    return successResponse(followUps)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const body = await request.json()

    const followUp = await prisma.followUp.create({
      data: {
        type: body.type,
        notes: body.notes,
        status: "PENDING",
        assignedToId: body.assignedToId || user.userId,
        memberId: body.memberId,
        branchId,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
      },
    })

    return successResponse(followUp, 201)
  } catch (error) {
    return handleApiError(error)
  }
}