// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../../lib/authenticate"

/** Forward a message to one or more conversations.
 *  Body: { target_conversation_ids: string[] } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { messageId } = await params
    const { target_conversation_ids: targets } = (await request.json()) as {
      target_conversation_ids?: string[]
    }
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { error: "target_conversation_ids required" },
        { status: 400 }
      )
    }

    const source = await db.message.findFirst({
      where: { id: messageId, conversation: { schoolId: auth.schoolId } },
      select: { id: true, content: true, contentType: true },
    })
    if (!source)
      return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Verify each target conversation is one user participates in
    const participantRecords = await db.conversationParticipant.findMany({
      where: {
        conversationId: { in: targets },
        userId: auth.userId,
        isActive: true,
      },
      select: { conversationId: true },
    })
    const allowed = new Set(participantRecords.map((p) => p.conversationId))

    const created: string[] = []
    for (const targetId of targets) {
      if (!allowed.has(targetId)) continue
      const m = await db.message.create({
        data: {
          conversationId: targetId,
          senderId: auth.userId,
          content: source.content,
          contentType: source.contentType,
          status: "sent",
          forwardedFromId: messageId,
        },
        select: { id: true },
      })
      created.push(m.id)
      await db.conversation.update({
        where: { id: targetId },
        data: { lastMessageAt: new Date() },
      })
    }
    return NextResponse.json({ success: true, forwarded: created })
  } catch (error) {
    console.error("Mobile forward error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
