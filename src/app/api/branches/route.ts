import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"

export async function GET() {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        _count: {
          select: {
            members: true,
            users: true,
            contributions: true,
          },
        },
      },
    })

    return successResponse(branches)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    if (user.role !== "SUPER_ADMIN") {
      return new Response("Only super admins can create branches", { status: 403 })
    }

    const body = await request.json()
    const branch = await prisma.branch.create({
      data: {
        name: body.name,
        code: body.code,
        address: body.address,
        city: body.city,
        state: body.state,
        phone: body.phone,
        email: body.email,
      },
    })

    return successResponse(branch, 201)
  } catch (error) {
    return handleApiError(error)
  }
}