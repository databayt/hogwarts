// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/** Global search across all conversations the user participates in.
 *  GET /api/mobile/messages/search?q=...&limit=... */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() ?? ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "30"), 100)
    if (q.length < 2) {
      return NextResponse.json({ data: [], total: 0 })
    }

    const participantRecords = await db.conversationParticipant.findMany({
      where: { userId: auth.userId, isActive: true },
      select: { conversationId: true },
    })
    const convoIds = participantRecords.map((p) => p.conversationId)
    if (convoIds.length === 0) return NextResponse.json({ data: [], total: 0 })

    const messages = await db.message.findMany({
      where: {
        conversationId: { in: convoIds },
        isDeleted: false,
        content: { contains: q, mode: "insensitive" },
        conversation: { schoolId: auth.schoolId },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        createdAt: true,
        sender: { select: { username: true } },
        conversation: { select: { title: true, type: true } },
      },
    })

    const data = messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      conversationTitle: m.conversation.title ?? "",
      conversationType: m.conversation.type,
      senderId: m.senderId,
      senderName: m.sender.username ?? "",
      content: m.content,
      sentAt: m.createdAt.toISOString(),
    }))
    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    console.error("Mobile message search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
