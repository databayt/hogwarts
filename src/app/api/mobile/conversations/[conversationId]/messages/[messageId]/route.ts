// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

const EDIT_WINDOW_MS = 15 * 60 * 1000

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ conversationId: string; messageId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { conversationId, messageId } = await params
    const { content } = (await request.json()) as { content?: string }

    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "content required" }, { status: 400 })
    }

    const message = await db.message.findFirst({
      where: {
        id: messageId,
        conversationId,
        conversation: { schoolId: auth.schoolId },
      },
      select: { id: true, senderId: true, createdAt: true },
    })
    if (!message)
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (message.senderId !== auth.userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (Date.now() - message.createdAt.getTime() > EDIT_WINDOW_MS)
      return NextResponse.json(
        { error: "Edit window expired" },
        { status: 400 }
      )

    await db.message.update({
      where: { id: messageId },
      data: { content: content.trim(), isEdited: true, editedAt: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile edit message error:", error)
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

    const { conversationId, messageId } = await params

    const message = await db.message.findFirst({
      where: {
        id: messageId,
        conversationId,
        conversation: { schoolId: auth.schoolId },
      },
      select: { id: true, senderId: true },
    })
    if (!message)
      return NextResponse.json({ error: "Not found" }, { status: 404 })

    const participant = await db.conversationParticipant.findFirst({
      where: { conversationId, userId: auth.userId, isActive: true },
      select: { role: true },
    })
    const canDelete =
      message.senderId === auth.userId ||
      participant?.role === "owner" ||
      participant?.role === "admin"
    if (!canDelete)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await db.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: "[Message deleted]",
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile delete message error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
