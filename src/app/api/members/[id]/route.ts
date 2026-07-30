import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request)
    const { id } = await params
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        family: true,
        contributions: { orderBy: { date: "desc" }, take: 20 },
        attendances: { orderBy: { date: "desc" }, take: 20 },
        visitations: { orderBy: { visitDate: "desc" }, take: 10 },
        followUps: { orderBy: { createdAt: "desc" }, take: 10 },
        volunteerAssignments: { include: { role: true } },
      },
    })
    if (!member) return new Response("Not found", { status: 404 })
    return successResponse(member)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request)
    const { id } = await params
    const body = await request.json()

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...body,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        joinedDate: body.joinedDate ? new Date(body.joinedDate) : undefined,
        anniversaryDate: body.anniversaryDate ? new Date(body.anniversaryDate) : undefined,
      },
    })

    return successResponse(member)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(request)
    const { id } = await params
    await prisma.member.delete({ where: { id } })
    return successResponse({ message: "Member deleted" })
  } catch (error) {
    return handleApiError(error)
  }
}