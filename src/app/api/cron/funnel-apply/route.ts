// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron: drain the Twenty inbox (`TwentyInboundEvent` → applied/ignored).
 *
 * The production home of the funnel applier. Until this route existed, webhook
 * rows landed in the inbox and sat `pending` until someone ran the script
 * against the prod env by hand — "received" and "applied" were separately
 * observable, and the answer was always "not applied". Hourly is plenty: the
 * signal being applied is a human dragging a card to WARM, and stop-on-reply
 * is enforced by the human who read the reply, not by this drain.
 *
 * Auth: Vercel Cron injects `Authorization: Bearer ${CRON_SECRET}` (same
 * pattern as every other cron here). Manual runs: same header via curl —
 * add `?dry=1` to classify without writing, which is also the cheap probe
 * that the route and its DB path are healthy.
 *
 * The logic lives in `@/lib/funnel/apply-inbox` — ONE implementation shared
 * with `scripts/funnel/apply-inbox.ts` (dry runs, local work, launchd).
 */
import { NextRequest, NextResponse } from "next/server"

import { applyInbox } from "@/lib/funnel/apply-inbox"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    console.error("[funnel-apply] CRON_SECRET not configured")
    return false
  }
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const dryRun = request.nextUrl.searchParams.get("dry") === "1"
  const startedAt = Date.now()

  try {
    const report = await applyInbox({ dryRun })
    console.log(
      `[funnel-apply] ${dryRun ? "dry" : "applied"}: pending=${report.pending} applied=${report.applied} ignored=${report.ignored} left=${report.left} in ${Date.now() - startedAt}ms`
    )
    return NextResponse.json({ ok: true, ms: Date.now() - startedAt, ...report })
  } catch (error) {
    console.error("[funnel-apply] failed", error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 }
    )
  }
}
