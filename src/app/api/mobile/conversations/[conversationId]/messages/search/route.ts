// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

/** Search within a single conversation.
 *  GET /api/mobile/conversations/:id/messages/search?q=...&limit=... */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId } = await params
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.trim() ?? ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

    const isParticipant = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: auth.userId, isActive: true },
      select: { id: true },
    })
    if (!isParticipant)
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })

    if (q.length < 2) return NextResponse.json({ data: [], total: 0 })

    const messages = await db.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        content: { contains: q, mode: "insensitive" },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        senderId: true,
        content: true,
        createdAt: true,
        sender: { select: { username: true } },
      },
    })

    const data = messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.username ?? "",
      content: m.content,
      sentAt: m.createdAt.toISOString(),
    }))
    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    console.error("Mobile conversation message search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
