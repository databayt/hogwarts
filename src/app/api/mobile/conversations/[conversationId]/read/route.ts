// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * POST /api/mobile/conversations/:id/read — mark conversation as read
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId } = await params

    await db.conversationParticipant.updateMany({
      // Scope by conversation.schoolId so a token from one school can't reset
      // unread state on another school's conversation (parity with siblings).
      where: {
        conversationId,
        userId: auth.userId,
        conversation: { schoolId: auth.schoolId },
      },
      data: { unreadCount: 0, lastReadAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile mark read error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
