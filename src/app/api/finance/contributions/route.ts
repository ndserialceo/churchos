import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"
import type { Prisma } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const where: Prisma.ContributionWhereInput = { branchId }
    if (type) where.type = type as any
    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    const contributions = await prisma.contribution.findMany({
      where,
      include: { member: true, recordedBy: true },
      orderBy: { date: "desc" },
    })

    return successResponse(contributions)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const body = await request.json()

    const contribution = await prisma.contribution.create({
      data: {
        type: body.type,
        amount: parseFloat(body.amount),
        currency: body.currency || "NGN",
        date: new Date(body.date),
        notes: body.notes,
        memberId: body.memberId,
        branchId,
        recordedById: user.userId,
      },
    })

    return successResponse(contribution, 201)
  } catch (error) {
    return handleApiError(error)
  }
}