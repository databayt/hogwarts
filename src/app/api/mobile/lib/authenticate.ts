// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { verifyToken } from "../auth/jwt"

export interface MobileAuthContext {
  userId: string
  email: string
  schoolId: string
  role: string
}

/**
 * Shared authentication helper for mobile API routes.
 *
 * Extracts and verifies the Bearer token from the Authorization header,
 * then returns the decoded user context (userId, email, schoolId, role).
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

  const schoolId = payload.schoolId as string | null
  if (!schoolId) {
    return NextResponse.json({ error: "No school context" }, { status: 400 })
  }

  return {
    userId: payload.sub as string,
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
