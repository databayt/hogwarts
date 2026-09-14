// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { verifyToken } from "../auth/jwt"

export interface MobileAuthContext {
  userId: string
  email: string
  schoolId: string
  role: string
}

/**
 * How long a user's suspension flag and token version are trusted before
 * re-reading them. Logout invalidates its own entry immediately; another
 * server instance can honour a revoked token for at most this long.
 */
const USER_STATE_TTL_MS = 60 * 1000

type UserState = { isSuspended: boolean; tokenVersion: number } | null

const userStateCache = new Map<string, { at: number; state: UserState }>()

async function readUserState(userId: string): Promise<UserState> {
  const hit = userStateCache.get(userId)
  if (hit && Date.now() - hit.at < USER_STATE_TTL_MS) return hit.state

  const row = await db.user.findUnique({
    where: { id: userId },
    select: { isSuspended: true, tokenVersion: true },
  })
  const state: UserState = row
    ? { isSuspended: row.isSuspended, tokenVersion: row.tokenVersion ?? 0 }
    : null
  userStateCache.set(userId, { at: Date.now(), state })
  return state
}

/** Drop a user's cached state — call after bumping tokenVersion or suspending. */
export function invalidateAuthCache(userId: string): void {
  userStateCache.delete(userId)
}

/** Test hook: forget every cached user state. */
export function _resetAuthCache(): void {
  userStateCache.clear()
}

/**
 * Shared authentication helper for mobile API routes.
 *
 * Verifies the Bearer token, then checks the user still exists, is not
 * suspended, and that the token's `tv` claim matches `User.tokenVersion`
 * (tokens minted before `tv` existed count as version 0).
 *
 * Returns either the auth context or a NextResponse error.
 */
export async function authenticate(
  request: NextRequest
): Promise<MobileAuthContext | NextResponse> {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload
  try {
    const result = await verifyToken(token)
    payload = result.payload
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  // A refresh token is not an access token.
  if (payload.type === "refresh") {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const userId = payload.sub as string | undefined
  if (!userId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const schoolId = payload.schoolId as string | null
  if (!schoolId) {
    return NextResponse.json({ error: "No school context" }, { status: 400 })
  }

  const state = await readUserState(userId)
  if (!state) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
  if (state.isSuspended) {
    return NextResponse.json({ error: "suspended" }, { status: 403 })
  }
  const tv = typeof payload.tv === "number" ? payload.tv : 0
  if (tv !== state.tokenVersion) {
    return NextResponse.json({ error: "Token revoked" }, { status: 401 })
  }

  return {
    userId,
    email: (payload.email as string) || "",
    schoolId,
    role: (payload.role as string) || "",
  }
}

/**
 * Type guard to check if authenticate() returned an error response.
 */
export function isAuthError(
  result: MobileAuthContext | NextResponse
): result is NextResponse {
  return result instanceof NextResponse
}
