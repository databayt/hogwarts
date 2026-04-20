// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * Mobile Messages API
 *
 * GET  /api/mobile/conversations/:id/messages — list messages
 * POST /api/mobile/conversations/:id/messages — send a message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId } = await params

    // Verify user is participant
    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: auth.userId, isActive: true },
    })
    if (!participant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get("cursor") || undefined
    const limit = parseInt(searchParams.get("limit") || "50")

    const messages = await db.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        contentType: true,
        status: true,
        createdAt: true,
        isEdited: true,
        isDeleted: true,
        replyToId: true,
        whatsappStatus: true,
        sender: { select: { username: true, image: true } },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            fileType: true,
            fileSize: true,
            thumbnail: true,
            width: true,
            height: true,
          },
        },
      },
    })

    const data = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.sender.username || "",
      senderAvatarUrl: m.sender.image,
      content: m.content,
      contentType: m.contentType,
      status: m.status,
      sentAt: m.createdAt.toISOString(),
      isRead: m.status === "read",
      isEdited: m.isEdited,
      isDeleted: m.isDeleted,
      replyToId: m.replyToId,
      nonce: null,
      whatsappStatus: m.whatsappStatus,
      attachments: m.attachments.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        fileType: a.fileType,
        fileSize: a.fileSize,
        thumbnail: a.thumbnail,
        width: a.width,
        height: a.height,
      })),
    }))

    return NextResponse.json({
      data,
      next_cursor:
        messages.length === limit ? messages[messages.length - 1]?.id : null,
    })
  } catch (error) {
    console.error("Mobile messages error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId } = await params
    const body = await request.json()
    const { content, reply_to_id, nonce } = body

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      )
    }

    // Verify user is participant
    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: auth.userId, isActive: true },
    })
    if (!participant) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })
    }

    // Deduplicate by nonce
    if (nonce) {
      const existing = await db.message.findFirst({
        where: {
          conversationId,
          senderId: auth.userId,
          metadata: { path: ["nonce"], equals: nonce },
        },
        select: { id: true },
      })
      if (existing) {
        return NextResponse.json({ id: existing.id, deduplicated: true })
      }
    }

    const message = await db.message.create({
      data: {
        conversationId,
        senderId: auth.userId,
        content: content.trim(),
        contentType: "text",
        status: "sent",
        replyToId: reply_to_id || null,
        metadata: nonce ? { nonce } : undefined,
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        contentType: true,
        status: true,
        createdAt: true,
        sender: { select: { username: true, image: true } },
      },
    })

    // Update conversation lastMessageAt
    await db.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: message.createdAt },
    })

    // Increment unread for other participants
    await db.conversationParticipant.updateMany({
      where: { conversationId, userId: { not: auth.userId }, isActive: true },
      data: { unreadCount: { increment: 1 } },
    })

    return NextResponse.json({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.sender.username || "",
      senderAvatarUrl: message.sender.image,
      content: message.content,
      contentType: message.contentType,
      status: message.status,
      sentAt: message.createdAt.toISOString(),
      isRead: false,
      isEdited: false,
      isDeleted: false,
      replyToId: null,
      nonce,
      whatsappStatus: null,
    })
  } catch (error) {
    console.error("Mobile send message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
