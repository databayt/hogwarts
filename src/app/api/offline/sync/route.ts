// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import { applyOfflineItems, offlineBodySchema } from "@/lib/offline/apply"
import { checkUserRateLimit } from "@/lib/rate-limit"
import { getTenantContext } from "@/lib/tenant-context"

export type { OfflineSyncItem, OfflineSyncVerdict } from "@/lib/offline/apply"

/**
 * POST /api/offline/sync
 *
 * Drains a device's outbox — see `src/lib/offline/apply.ts` for the kinds,
 * the ordering and the per-item verdicts. The native app drains the same way
 * through `/api/mobile/offline/sync` with its bearer token.
 *
 * A route handler, not an action — see the notifications bell for why every
 * client-invoked action ships a full RSC re-render.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const userId = session.user.id

  const rl = await checkUserRateLimit(
    userId,
    { windowMs: 60 * 1000, maxRequests: 20 },
    "offline-sync"
  )
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }
  const parsed = offlineBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { schoolId } = await getTenantContext()

  const results = await applyOfflineItems(parsed.data.items, {
    userId,
    schoolId,
    role: String(session.user.role ?? ""),
  })

  return NextResponse.json(
    { results, serverTime: new Date().toISOString() },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  )
}
