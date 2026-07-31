import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logAudit } from "@/lib/auth"
import { validateRequest, communicationSchema } from "@/lib/validation"
import { successResponse, errorResponse, handleApiError } from "@/lib/api-utils"
import { sendSMS, sendWhatsApp } from "@/lib/africastalking"

export async function GET(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const type = searchParams.get("type")
    const status = searchParams.get("status")

    const where: Record<string, unknown> = { branchId: auth.branchId }
    if (type) where.type = type
    if (status) where.status = status

    const [communications, total] = await Promise.all([
      prisma.communication.findMany({
        where,
        include: {
          member: { select: { id: true, firstName: true, lastName: true } },
          sentBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.communication.count({ where }),
    ])

    return successResponse({ communications, total, page, limit, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request)
    const body = await request.json()
    const validation = validateRequest(communicationSchema, body)
    if (!validation.success) return errorResponse(validation.error)

    const { type, recipient, subject, message, memberIds } = validation.data

    if (memberIds && memberIds.length > 0) {
      const members = await prisma.member.findMany({
        where: { id: { in: memberIds }, branchId: auth.branchId },
        select: { id: true, phone: true, firstName: true, lastName: true },
      })

      const results = await Promise.allSettled(
        members.map(async (member) => {
          const to = member.phone || ""
          let result: { success: boolean; messageId?: string; error?: string }
          if (type === "SMS") {
            result = await sendSMS(to, message)
          } else if (type === "WHATSAPP") {
            result = await sendWhatsApp(to, message)
          } else {
            result = { success: false, error: "Email sending not yet implemented" }
          }

          const status = result.success ? "SENT" : "FAILED"
          const comm = await prisma.communication.create({
            data: {
              type,
              recipient: `${member.firstName} ${member.lastName} (${to})`,
              subject: subject || null,
              message,
              status,
              sentAt: result.success ? new Date() : null,
              errorLog: result.error || null,
              memberId: member.id,
              branchId: auth.branchId,
              sentById: auth.userId,
            },
          })

          const forwarded = request.headers.get("x-forwarded-for")
          await logAudit({
            action: "COMMUNICATION_SENT",
            entity: "Communication",
            entityId: comm.id,
            userId: auth.userId,
            branchId: auth.branchId,
            newValues: { type, recipient: to, status },
            ipAddress: forwarded?.split(",")[0]?.trim(),
          })

          return comm
        })
      )

      const succeeded = results.filter((r) => r.status === "fulfilled").length
      const failed = results.filter((r) => r.status === "rejected").length
      return successResponse({ succeeded, failed, total: members.length }, 201)
    }

    let result: { success: boolean; messageId?: string; error?: string }
    if (type === "SMS") {
      result = await sendSMS(recipient, message)
    } else if (type === "WHATSAPP") {
      result = await sendWhatsApp(recipient, message)
    } else {
      result = { success: false, error: "Email sending not yet implemented" }
    }

    const status = result.success ? "SENT" : "FAILED"
    const communication = await prisma.communication.create({
      data: {
        type,
        recipient,
        subject: subject || null,
        message,
        status,
        sentAt: result.success ? new Date() : null,
        errorLog: result.error || null,
        branchId: auth.branchId,
        sentById: auth.userId,
      },
    })

    const forwarded = request.headers.get("x-forwarded-for")
    await logAudit({
      action: "COMMUNICATION_SENT",
      entity: "Communication",
      entityId: communication.id,
      userId: auth.userId,
      branchId: auth.branchId,
      newValues: { type, recipient, status },
      ipAddress: forwarded?.split(",")[0]?.trim(),
    })

    return successResponse(communication, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
