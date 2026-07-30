import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getBranchId } from "@/lib/auth"
import { successResponse, handleApiError } from "@/lib/api-utils"
import { sendSMS, sendWhatsApp } from "@/lib/africastalking"

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    const where: Record<string, unknown> = { branchId }
    if (type) where.type = type

    const communications = await prisma.communication.findMany({
      where,
      include: { member: true, sentBy: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })

    return successResponse(communications)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request)
    const branchId = getBranchId(request, user)
    const body = await request.json()

    const { type, memberId, recipient, subject, message } = body

    let result
    if (type === "SMS") {
      result = await sendSMS(recipient, message)
    } else if (type === "WHATSAPP") {
      result = await sendWhatsApp(recipient, message)
    }

    const communication = await prisma.communication.create({
      data: {
        type,
        recipient,
        subject,
        message,
        status: result?.success ? "SENT" : "FAILED",
        sentAt: result?.success ? new Date() : null,
        errorLog: result?.error,
        memberId,
        branchId,
        sentById: user.userId,
      },
    })

    const statusCode = result?.success ? 201 : 400
    return successResponse(communication, statusCode)
  } catch (error) {
    return handleApiError(error)
  }
}