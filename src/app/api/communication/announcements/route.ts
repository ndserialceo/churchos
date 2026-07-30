import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { branchId },
          { targetBranchId: null },
          { targetBranchId: branchId },
        ],
      },
      include: { createdBy: true },
      orderBy: { createdAt: "desc" },
    })

    return successResponse(announcements)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const body = await request.json()

    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        priority: body.priority || "NORMAL",
        branchId,
        createdById: user.userId,
      },
    })

    return successResponse(announcement, 201)
  } catch (error) {
    return handleApiError(error)
  }
}