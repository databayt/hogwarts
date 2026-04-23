// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../../lib/authenticate"

/** POST toggles star. Body: { starred: boolean } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId, messageId } = await params
    const { starred } = (await request.json()) as { starred?: boolean }

    const message = await db.message.findFirst({
      where: { id: messageId, conversation: { schoolId: auth.schoolId } },
      select: { id: true },
    })
    if (!message)
      return NextResponse.json({ error: "Not found" }, { status: 404 })

    if (starred === false) {
      await db.starredMessage.deleteMany({
        where: { messageId, userId: auth.userId },
      })
    } else {
      await db.starredMessage.upsert({
        where: {
          userId_messageId: { messageId, userId: auth.userId },
        },
        create: { messageId, userId: auth.userId, conversationId },
        update: {},
      })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile star message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
