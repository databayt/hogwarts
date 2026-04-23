// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/** List the current user's starred messages.
 *  GET /api/mobile/starred-messages?limit=... */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)

    const starred = await db.starredMessage.findMany({
      where: {
        userId: auth.userId,
        message: {
          conversation: { schoolId: auth.schoolId },
          isDeleted: false,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        createdAt: true,
        message: {
          select: {
            id: true,
            conversationId: true,
            senderId: true,
            content: true,
            contentType: true,
            createdAt: true,
            sender: { select: { username: true } },
            conversation: { select: { title: true, type: true } },
          },
        },
      },
    })

    const data = starred.map((s) => ({
      id: s.id,
      starredAt: s.createdAt.toISOString(),
      message: {
        id: s.message.id,
        conversationId: s.message.conversationId,
        conversationTitle: s.message.conversation.title ?? "",
        conversationType: s.message.conversation.type,
        senderId: s.message.senderId,
        senderName: s.message.sender.username ?? "",
        content: s.message.content,
        contentType: s.message.contentType,
        sentAt: s.message.createdAt.toISOString(),
      },
    }))

    return NextResponse.json({ data, total: data.length })
  } catch (error) {
    console.error("Mobile starred-messages error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
