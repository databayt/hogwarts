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

        // Extract phone number from connection data when connected
        const connectedPhone =
          body.data?.wid?.replace("@s.whatsapp.net", "") ||
          body.data?.instance?.wuid?.replace("@s.whatsapp.net", "") ||
          null

        await db.whatsAppSession.update({
          where: { id: session.id },
          data: {
            status: newStatus,
            ...(newStatus === "connected"
              ? {
                  connectedAt: new Date(),
                  qrCode: null,
                  ...(connectedPhone ? { phoneNumber: connectedPhone } : {}),
                }
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
        // Log incoming messages and bridge to in-app conversations
        const messages = body.data ?? []
        for (const msg of Array.isArray(messages) ? messages : [messages]) {
          const key = msg.key
          if (!key) continue

          const isFromMe = key.fromMe === true
          const msgData = msg.message ?? {}

          // Extract text content from various message types
          const content =
            msgData.conversation ||
            msgData.extendedTextMessage?.text ||
            msgData.imageMessage?.caption ||
            msgData.videoMessage?.caption ||
            msgData.documentMessage?.caption ||
            ""

          // Detect media message types
          const hasImage = !!msgData.imageMessage
          const hasVideo = !!msgData.videoMessage
          const hasAudio = !!msgData.audioMessage
          const hasDocument = !!msgData.documentMessage
          const hasMedia = hasImage || hasVideo || hasAudio || hasDocument

          // Skip messages with no content and no media
          if (!content && !hasMedia) continue

          const contentType = hasImage
            ? "image"
            : hasVideo
              ? "video"
              : hasAudio
                ? "audio"
                : hasDocument
                  ? "document"
                  : "text"

          const senderPhone = key.remoteJid?.includes("@g.us")
            ? null
            : (key.remoteJid?.replace("@s.whatsapp.net", "+") ?? null)

          // Log to WhatsApp audit table
          await db.whatsAppMessage.create({
            data: {
              schoolId: session.schoolId,
              sessionId: session.id,
              waMessageId: key.id,
              recipientPhone: senderPhone,
              groupId: null,
              content: content || `[${contentType}]`,
              contentType,
              direction: isFromMe ? "outgoing" : "incoming",
              status: "delivered",
              sentAt: new Date(),
            },
          })

          // Bridge incoming messages to in-app conversations
          if (!isFromMe && senderPhone) {
            try {
              // Find participant with this WhatsApp phone in a whatsapp-enabled conversation
              const participant = await db.conversationParticipant.findFirst({
                where: {
                  whatsappPhone: senderPhone,
                  isActive: true,
                  conversation: {
                    schoolId: session.schoolId,
                    whatsappEnabled: true,
                  },
                },
                include: {
                  conversation: { select: { id: true } },
                },
                orderBy: {
                  conversation: { lastMessageAt: "desc" },
                },
              })

              if (participant) {
                // Create the bridged message
                const bridgedMessage = await db.message.create({
                  data: {
                    conversationId: participant.conversation.id,
                    senderId: participant.userId,
                    content,
                    contentType,
                    status: "delivered",
                    whatsappMessageId: key.id,
                    whatsappStatus: "delivered",
                    whatsappPhone: senderPhone,
                  },
                })

                // Download and attach media if present
                if (hasMedia) {
                  try {
                    const evolution =
                      await import("@/lib/whatsapp/evolution-client")
                    const mediaResult = await evolution.downloadMedia(
                      instanceName,
                      {
                        remoteJid: key.remoteJid,
                        fromMe: false,
                        id: key.id,
                      }
                    )

                    if (mediaResult.base64) {
                      // Determine MIME type and filename
                      const mimetype =
                        mediaResult.mimetype ||
                        msgData.imageMessage?.mimetype ||
                        msgData.videoMessage?.mimetype ||
                        msgData.audioMessage?.mimetype ||
                        msgData.documentMessage?.mimetype ||
                        "application/octet-stream"

                      const fileName =
                        mediaResult.fileName ||
                        msgData.documentMessage?.fileName ||
                        `wa-media-${key.id}.${mimetype.split("/")[1] || "bin"}`

                      // Store as data URL for now (can be uploaded to S3 in a future step)
                      const dataUrl = `data:${mimetype};base64,${mediaResult.base64}`

                      // Estimate file size from base64 length
                      const fileSize = Math.ceil(
                        (mediaResult.base64.length * 3) / 4
                      )

                      await db.messageAttachment.create({
                        data: {
                          messageId: bridgedMessage.id,
                          fileName,
                          fileUrl: dataUrl,
                          fileSize,
                          fileType: mimetype,
                          width: msgData.imageMessage?.width ?? null,
                          height: msgData.imageMessage?.height ?? null,
                          uploaded: true,
                          uploadedAt: new Date(),
                        },
                      })
                    }
                  } catch (mediaError) {
                    console.error(
                      "[WhatsApp Webhook] Media download error:",
                      mediaError
                    )
                  }
                }

                await db.conversation.update({
                  where: { id: participant.conversation.id },
                  data: { lastMessageAt: new Date() },
                })

                // Emit Socket.IO event for real-time push with full data
                try {
                  // Fetch sender info and attachments for rich emit
                  const [senderUser, msgAttachments] = await Promise.all([
                    db.user.findUnique({
                      where: { id: participant.userId },
                      select: {
                        id: true,
                        username: true,
                        email: true,
                        image: true,
                      },
                    }),
                    db.messageAttachment.findMany({
                      where: { messageId: bridgedMessage.id },
                      select: {
                        id: true,
                        fileUrl: true,
                        fileName: true,
                        fileSize: true,
                        fileType: true,
                        thumbnail: true,
                      },
                    }),
                  ])

                  const socketUrl =
                    process.env.NEXT_PUBLIC_SOCKET_URL ||
                    "http://localhost:3001"
                  await fetch(`${socketUrl}/api/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      room: `conversation:${participant.conversation.id}`,
                      event: "message:new",
                      data: {
                        id: bridgedMessage.id,
                        conversationId: participant.conversation.id,
                        senderId: participant.userId,
                        content,
                        contentType,
                        createdAt: bridgedMessage.createdAt.toISOString(),
                        sender: senderUser,
                        attachments: msgAttachments.map((a) => ({
                          id: a.id,
                          url: a.fileUrl,
                          fileName: a.fileName,
                          fileSize: a.fileSize,
                          fileType: a.fileType,
                          thumbnail: a.thumbnail,
                        })),
                      },
                    }),
                  })
                } catch {
                  // Socket.IO push is best-effort
                }
              }
            } catch (bridgeError) {
              console.error("[WhatsApp Webhook] Bridge error:", bridgeError)
            }
          }
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

          // Sync status to bridged in-app messages (scoped by school)
          await db.message.updateMany({
            where: {
              whatsappMessageId: waMessageId,
              conversation: { schoolId: session.schoolId },
            },
            data: { whatsappStatus: mappedStatus },
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
