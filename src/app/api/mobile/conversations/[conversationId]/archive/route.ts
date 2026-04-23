// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/** Archive a conversation (soft). Body: { archived: boolean } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId } = await params
    const { archived } = (await request.json()) as { archived?: boolean }

    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: auth.userId, isActive: true },
      select: { role: true },
    })
    if (!participant)
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })

    await db.conversation.updateMany({
      where: { id: conversationId, schoolId: auth.schoolId },
      data: { isArchived: archived ?? true },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile archive conversation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
