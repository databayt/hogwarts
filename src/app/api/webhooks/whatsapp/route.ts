import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { db } from "@/lib/db"

// Evolution API sends webhook events here
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = body.event
    const instanceName = body.instance

    // Find the session for this instance
    const session = await db.whatsAppSession.findFirst({
      where: { instanceName },
      select: { id: true, schoolId: true },
    })

    if (!session) {
      return NextResponse.json({ error: "Unknown instance" }, { status: 404 })
    }

    switch (event) {
      case "CONNECTION_UPDATE": {
        const state = body.data?.state
        const newStatus =
          state === "open"
            ? "connected"
            : state === "close"
              ? "disconnected"
              : "connecting"

        await db.whatsAppSession.update({
          where: { id: session.id },
          data: {
            status: newStatus,
            ...(newStatus === "connected"
              ? { connectedAt: new Date(), qrCode: null }
              : {}),
            ...(newStatus === "disconnected" ? { phoneNumber: null } : {}),
          },
        })
        break
      }

      case "QRCODE_UPDATED": {
        const qrCode = body.data?.qrcode?.base64
        if (qrCode) {
          await db.whatsAppSession.update({
            where: { id: session.id },
            data: { qrCode, status: "qr_pending" },
          })
        }
        break
      }

      case "MESSAGES_UPSERT": {
        // Log incoming messages
        const messages = body.data ?? []
        for (const msg of Array.isArray(messages) ? messages : [messages]) {
          const key = msg.key
          if (!key) continue

          const isFromMe = key.fromMe === true
          const content =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            ""

          if (!content) continue

          await db.whatsAppMessage.create({
            data: {
              schoolId: session.schoolId,
              sessionId: session.id,
              waMessageId: key.id,
              recipientPhone: key.remoteJid?.includes("@g.us")
                ? null
                : (key.remoteJid?.replace("@s.whatsapp.net", "+") ?? null),
              groupId: null,
              content,
              contentType: "text",
              direction: isFromMe ? "outgoing" : "incoming",
              status: "delivered",
              sentAt: new Date(),
            },
          })
        }
        break
      }

      case "MESSAGES_UPDATE": {
        // Update message delivery status
        const updates = body.data ?? []
        for (const update of Array.isArray(updates) ? updates : [updates]) {
          const waMessageId = update.key?.id
          const status = update.update?.status
          if (!waMessageId || !status) continue

          const statusMap: Record<number, string> = {
            2: "sent",
            3: "delivered",
            4: "read",
            5: "read",
          }
          const mappedStatus = statusMap[status]
          if (!mappedStatus) continue

          await db.whatsAppMessage.updateMany({
            where: { waMessageId, schoolId: session.schoolId },
            data: {
              status: mappedStatus as "sent" | "delivered" | "read",
              ...(mappedStatus === "delivered"
                ? { deliveredAt: new Date() }
                : {}),
              ...(mappedStatus === "read" ? { readAt: new Date() } : {}),
            },
          })
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[WhatsApp Webhook]", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// Health check for Evolution API
export async function GET() {
  return NextResponse.json({ status: "ok" })
}
