// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/** Leave a conversation (soft-leave participant record). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId } = await params

    const updated = await db.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: auth.userId,
        isActive: true,
        conversation: { schoolId: auth.schoolId },
      },
      data: { isActive: false, leftAt: new Date() },
    })
    if (updated.count === 0)
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile leave conversation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
