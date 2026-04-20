// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * POST /api/mobile/auth/logout — mobile logout
 *
 * Confirms logout to the mobile app. The JWT is stateless so there is
 * no server-side session to destroy — the client discards its token.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
