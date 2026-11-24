// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { touchActivity } from "@/lib/activity"
import {
  hashHandoffCode,
  parseHandoffIdentifier,
} from "@/lib/app-handoff"
import { logLoginAttempt } from "@/lib/audit-log"
import { parseAppVersion } from "@/lib/client-info"
import { db } from "@/lib/db"
import { buildAuthResponse } from "@/app/api/mobile/auth/jwt"

/**
 * POST /api/mobile/auth/handoff
 * Body: { code: string } — the one-time code the web page put in `app_login`.
 * Returns the same shape as POST /api/mobile/auth:
 *   { access_token, refresh_token, expires_at, user }
 * 400 bad body · 401 invalid, expired or already used.
 */
const Body = z.object({ code: z.string().min(16).max(256) })

const invalid = () =>
  NextResponse.json({ error: "Invalid or expired code" }, { status: 401 })

export async function POST(request: NextRequest) {
  try {
    const parsed = Body.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const hash = hashHandoffCode(parsed.data.code)
    const now = new Date()

    // Single use: read then delete inside one transaction; only the request
    // whose delete removed exactly one row proceeds.
    const identifier = await db.$transaction(async (tx) => {
      const row = await tx.verificationToken.findUnique({
        where: { token: hash },
        select: { email: true, expires: true },
      })
      if (!row || row.expires <= now) return null
      const { count } = await tx.verificationToken.deleteMany({
        where: { token: hash, expires: { gt: now } },
      })
      return count === 1 ? row.email : null
    })
    const target = identifier ? parseHandoffIdentifier(identifier) : null
    if (!target) return invalid()

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      undefined

    const user = await db.user.findUnique({
      where: { id: target.userId },
      select: {
        id: true,
        email: true,
        schoolId: true,
        role: true,
        username: true,
        image: true,
        isSuspended: true,
        tokenVersion: true,
      },
    })
    if (!user || user.isSuspended || user.schoolId !== target.schoolId) {
      return invalid()
    }

    await logLoginAttempt({
      email: user.email ?? user.username ?? user.id,
      success: true,
      schoolId: user.schoolId,
      ip,
      client: "app",
    })
    void touchActivity({
      userId: user.id,
      schoolId: user.schoolId,
      client: "app",
      platform: "android",
      appVersion: parseAppVersion(request.headers.get("X-App-Version")),
    })
    return NextResponse.json(await buildAuthResponse(user))
  } catch (error) {
    console.error("Mobile handoff error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
