// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import {
  authenticate,
  invalidateAuthCache,
  isAuthError,
} from "../../lib/authenticate"

/**
 * POST /api/mobile/auth/logout — mobile logout
 *
 * Revokes every mobile token the user holds: bumping `User.tokenVersion`
 * makes all access and refresh tokens carrying the old `tv` claim fail
 * `authenticate()` and the refresh endpoint. Signs the user out of every
 * device, which is the only revocation a stateless JWT allows.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    await db.user.update({
      where: { id: auth.userId },
      data: { tokenVersion: { increment: 1 } },
      select: { id: true },
    })
    invalidateAuthCache(auth.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
