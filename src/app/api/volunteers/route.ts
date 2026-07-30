import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)

    const [roles, assignments] = await Promise.all([
      prisma.volunteerRole.findMany({
        where: { branchId },
        include: {
          assignments: {
            where: { isActive: true },
            include: { member: true },
          },
        },
      }),
      prisma.volunteerAssignment.findMany({
        where: { branchId, isActive: true },
        include: { member: true, role: true },
      }),
    ])

    return successResponse({ roles, assignments })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const body = await request.json()

    if (body.type === "role") {
      const role = await prisma.volunteerRole.create({
        data: {
          name: body.name,
          description: body.description,
          branchId,
        },
      })
      return successResponse(role, 201)
    }

    if (body.type === "assign") {
      const assignment = await prisma.volunteerAssignment.create({
        data: {
          memberId: body.memberId,
          roleId: body.roleId,
          branchId,
          startDate: body.startDate ? new Date(body.startDate) : new Date(),
        },
      })
      return successResponse(assignment, 201)
    }

    return new Response("Invalid type", { status: 400 })
  } catch (error) {
    return handleApiError(error)
  }
}