import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logAudit } from "@/lib/auth"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request)
    const { id } = await params

    const followUp = await prisma.followUp.findFirst({
      where: { id, branchId: auth.branchId },
      include: {
        member: { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    if (!followUp) return errorResponse("Follow-up not found", 404)
    return successResponse(followUp)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request)
    const { id } = await params
    const body = await request.json()

    const existing = await prisma.followUp.findFirst({ where: { id, branchId: auth.branchId } })
    if (!existing) return errorResponse("Follow-up not found", 404)

    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.notes !== undefined) data.notes = body.notes
    if (body.type) data.type = body.type
    if (body.assignedToId) data.assignedToId = body.assignedToId
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.status === "COMPLETED") data.completedAt = new Date()

    const followUp = await prisma.followUp.update({
      where: { id },
      data,
      include: {
        member: { select: { id: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "UPDATE",
      entity: "FollowUp",
      entityId: followUp.id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: data,
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse(followUp)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request)
    const { id } = await params

    const existing = await prisma.followUp.findFirst({ where: { id, branchId: auth.branchId } })
    if (!existing) return errorResponse("Follow-up not found", 404)

    await prisma.followUp.delete({ where: { id } })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "DELETE",
      entity: "FollowUp",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse({ message: "Follow-up deleted" })
  } catch (error) {
    return handleApiError(error)
  }
}
