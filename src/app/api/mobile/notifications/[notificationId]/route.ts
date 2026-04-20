// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * DELETE /api/mobile/notifications/:notificationId — delete a notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { notificationId } = await params

    await db.notification.deleteMany({
      where: {
        id: notificationId,
        userId: auth.userId,
        schoolId: auth.schoolId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile delete notification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
