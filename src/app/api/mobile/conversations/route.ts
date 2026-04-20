// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { ConversationType } from "@prisma/client"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * Mobile Conversations API
 *
 * GET  /api/mobile/conversations         — list conversations
 * POST /api/mobile/conversations         — create a conversation
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || undefined

    const participantRecords = await db.conversationParticipant.findMany({
      where: { userId: auth.userId, isActive: true },
      select: {
        conversationId: true,
        unreadCount: true,
        isPinned: true,
        isMuted: true,
      },
    })

    const convoIds = participantRecords.map((p) => p.conversationId)
    if (convoIds.length === 0) {
      return NextResponse.json({ data: [], total: 0 })
    }

    const participantMap = new Map(
      participantRecords.map((p) => [p.conversationId, p])
    )

    const conversations = await db.conversation.findMany({
      where: {
        id: { in: convoIds },
        schoolId: auth.schoolId,
        isArchived: false,
        ...(type ? { type: type as ConversationType } : {}),
      },
      orderBy: { lastMessageAt: { sort: "desc", nulls: "last" } },
      select: {
        id: true,
        type: true,
        title: true,
        avatar: true,
        lastMessageAt: true,
        whatsappEnabled: true,
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            content: true,
            senderId: true,
            status: true,
            createdAt: true,
            sender: { select: { username: true } },
          },
        },
        participants: {
          where: { isActive: true },
          select: {
            user: { select: { id: true, username: true, image: true } },
          },
        },
      },
    })

    const data = conversations.map((c) => {
      const myParticipant = participantMap.get(c.id)
      const lastMsg = c.messages[0]

      // For direct conversations, show the other participant's name
      let title = c.title
      if (c.type === "direct" && !title) {
        const other = c.participants.find(
          (p: {
            user: { id: string; username: string | null; image: string | null }
          }) => p.user.id !== auth.userId
        )
        title = other?.user.username || "Unknown"
      }

      return {
        id: c.id,
        type: c.type,
        title,
        avatarUrl: c.avatar,
        unreadCount: myParticipant?.unreadCount || 0,
        isPinned: myParticipant?.isPinned || false,
        isMuted: myParticipant?.isMuted || false,
        whatsappEnabled: c.whatsappEnabled,
        updatedAt:
          (c.lastMessageAt || c.messages[0]?.createdAt)?.toISOString() || "",
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              content: lastMsg.content,
              senderName: lastMsg.sender.username || "",
              status: lastMsg.status,
              sentAt: lastMsg.createdAt.toISOString(),
            }
          : null,
      }
    })

    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    console.error("Mobile conversations error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const { type = "direct", title, participant_ids } = body

    if (
      !participant_ids ||
      !Array.isArray(participant_ids) ||
      participant_ids.length === 0
    ) {
      return NextResponse.json(
        { error: "participant_ids required" },
        { status: 400 }
      )
    }

    // For direct, check if conversation already exists
    if (type === "direct" && participant_ids.length === 1) {
      const otherId = participant_ids[0]
      const existing = await db.conversation.findFirst({
        where: {
          schoolId: auth.schoolId,
          type: "direct",
          OR: [
            {
              directParticipant1Id: auth.userId,
              directParticipant2Id: otherId,
            },
            {
              directParticipant1Id: otherId,
              directParticipant2Id: auth.userId,
            },
          ],
        },
        select: { id: true },
      })

      if (existing) {
        return NextResponse.json({ id: existing.id })
      }
    }

    const allParticipants = [
      auth.userId,
      ...participant_ids.filter((id: string) => id !== auth.userId),
    ]

    const conversation = await db.conversation.create({
      data: {
        schoolId: auth.schoolId,
        type,
        title: type === "direct" ? null : title,
        createdById: auth.userId,
        directParticipant1Id: type === "direct" ? auth.userId : null,
        directParticipant2Id: type === "direct" ? participant_ids[0] : null,
        participants: {
          create: allParticipants.map((userId: string) => ({
            userId,
            role: userId === auth.userId ? "owner" : "member",
          })),
        },
      },
      select: { id: true },
    })

    return NextResponse.json({ id: conversation.id }, { status: 201 })
  } catch (error) {
    console.error("Mobile create conversation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
