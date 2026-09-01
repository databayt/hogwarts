"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { performLiveClassJoin, type JoinResult } from "./join-core"

/**
 * Request a join token for a live class. Validates auth + tenant +
 * eligibility, ensures the SFU room exists, and returns a short-lived JWT
 * the client uses to connect. One-shot per room entry — called from the room
 * page's server render. The in-room ~4-min refresh deliberately does NOT go
 * through a server action: it polls GET /api/conference/token instead (see
 * join-core.ts for why), which re-runs the same eligibility check, so revoked
 * access takes effect at the next refresh boundary (≤5 min, not instant —
 * LiveKit JWTs are stateless and cannot be invalidated once issued).
 */
export async function joinLiveClass(sessionId: string): Promise<JoinResult> {
  return performLiveClassJoin(sessionId, { allowAutoStart: true })
}
