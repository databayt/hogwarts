// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/** Toggle pin on a conversation for the current user. Body: { pinned: boolean } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId } = await params
    const { pinned } = (await request.json()) as { pinned?: boolean }

    const updated = await db.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: auth.userId,
        isActive: true,
        conversation: { schoolId: auth.schoolId },
      },
      data: { isPinned: pinned ?? true },
    })

    if (updated.count === 0)
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile pin conversation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
