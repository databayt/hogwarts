// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * POST /api/mobile/notifications/read-all — mark all notifications read
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const result = await db.notification.updateMany({
      where: { userId: auth.userId, schoolId: auth.schoolId, read: false },
      data: { read: true, readAt: new Date() },
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error("Mobile read-all notifications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
