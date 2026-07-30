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
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { branchId }
    if (status) where.status = status
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    const members = await prisma.member.findMany({
      where,
      include: { family: true },
      orderBy: { createdAt: "desc" },
    })

    return successResponse(members)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const body = await request.json()

    const member = await prisma.member.create({
      data: {
        ...body,
        branchId,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        joinedDate: body.joinedDate ? new Date(body.joinedDate) : null,
        anniversaryDate: body.anniversaryDate ? new Date(body.anniversaryDate) : null,
      },
    })

    return successResponse(member, 201)
  } catch (error) {
    return handleApiError(error)
  }
}