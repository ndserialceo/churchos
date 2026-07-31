import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logAudit } from "@/lib/auth"
import { validateRequest, memberSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request)
    const { id } = await params

    const member = await prisma.member.findFirst({
      where: { id, branchId: auth.branchId },
      include: {
        family: true,
        contributions: { orderBy: { date: "desc" }, take: 10 },
        attendances: { orderBy: { date: "desc" }, take: 10 },
      },
    })

    if (!member) return errorResponse("Member not found", 404)
    return successResponse(member)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request)
    const { id } = await params
    const body = await request.json()
    const validation = validateRequest(memberSchema.partial(), body)
    if (!validation.success) return errorResponse(validation.error)

    const existing = await prisma.member.findFirst({ where: { id, branchId: auth.branchId } })
    if (!existing) return errorResponse("Member not found", 404)

    const member = await prisma.member.update({ where: { id }, data: validation.data })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "UPDATE",
      entity: "Member",
      entityId: member.id,
      oldValues: existing as unknown as Record<string, unknown>,
      newValues: validation.data as Record<string, unknown>,
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse(member)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = requireAuth(request)
    const { id } = await params

    const existing = await prisma.member.findFirst({ where: { id, branchId: auth.branchId } })
    if (!existing) return errorResponse("Member not found", 404)

    await prisma.member.delete({ where: { id } })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      userId: auth.userId,
      branchId: auth.branchId,
      action: "DELETE",
      entity: "Member",
      entityId: id,
      oldValues: existing as unknown as Record<string, unknown>,
      ipAddress: forwarded?.split(",")[0]?.trim(),
      userAgent: request.headers.get("user-agent") || undefined,
    })

    return successResponse({ message: "Member deleted" })
  } catch (error) {
    return handleApiError(error)
  }
}
