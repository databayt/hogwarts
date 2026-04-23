// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../../lib/authenticate"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId, messageId } = await params
    const { emoji } = (await request.json()) as { emoji?: string }
    if (!emoji)
      return NextResponse.json({ error: "emoji required" }, { status: 400 })

    const isParticipant = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: auth.userId, isActive: true },
      select: { id: true },
    })
    if (!isParticipant)
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })

    await db.messageReaction.upsert({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: auth.userId,
          emoji,
        },
      },
      create: { messageId, userId: auth.userId, emoji },
      update: {},
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile add reaction error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { messageId } = await params
    const { searchParams } = new URL(request.url)
    const emoji = searchParams.get("emoji")
    if (!emoji)
      return NextResponse.json({ error: "emoji required" }, { status: 400 })

    await db.messageReaction.deleteMany({
      where: {
        messageId,
        userId: auth.userId,
        emoji,
        message: { conversation: { schoolId: auth.schoolId } },
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile remove reaction error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
