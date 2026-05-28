// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Cron — auto-generate report-card metadata for terms that ended yesterday.
 *
 * Schedule: daily at 03:00 server time (see vercel.json). For each term
 * whose `endDate` was within the last 36 hours and which has zero
 * ReportCard rows yet, we mark a sentinel row so admins see "ready to
 * publish" in `/grades/reports` the next morning.
 *
 * Defensive: only acts when there is no existing ReportCard for the
 * term — avoids double-write on terms admins already processed. We do
 * NOT call the full `generateReportCards` action here because that
 * needs auth + tenant context; the cron flags the term as ready and
 * leaves the rich aggregation to the admin-initiated path.
 *
 * Auth: shared CRON_SECRET bearer (constant-time comparison).
 */

function isAuthorizedCron(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[cron/term-end-report-cards] CRON_SECRET unset in production — refusing"
      )
      return false
    }
    return true
  }

  const header = request.headers.get("authorization") ?? ""
  if (!header.startsWith("Bearer ")) return false
  const token = header.slice("Bearer ".length)
  if (token.length !== expected.length) return false
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    const now = new Date()
    const windowStart = new Date(now.getTime() - 36 * 60 * 60 * 1000)
    const windowEnd = now

    // Terms whose endDate falls in the last 36h. The window is wider
    // than 24h so a single missed run doesn't drop a term silently.
    const recentlyEnded = await db.term.findMany({
      where: {
        endDate: { gte: windowStart, lte: windowEnd },
      },
      select: {
        id: true,
        schoolId: true,
        termNumber: true,
        endDate: true,
      },
    })

    if (recentlyEnded.length === 0) {
      return NextResponse.json({
        success: true,
        flaggedTerms: 0,
        skippedTerms: 0,
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      })
    }

    // For each ended term, check if there are already report cards.
    // We don't generate anything here — the actual aggregation runs
    // via the admin "Generate report cards" button (rich pipeline).
    // The cron's value is the structured log: ops sees which schools
    // have ended terms still missing report cards each morning.
    let flagged = 0
    let skipped = 0
    for (const term of recentlyEnded) {
      const existing = await db.reportCard.count({
        where: { schoolId: term.schoolId, termId: term.id },
      })

      const logLine = {
        action: "term_end_report_card_check",
        schoolId: term.schoolId,
        termId: term.id,
        termNumber: term.termNumber,
        endDate: term.endDate.toISOString(),
        existingReportCards: existing,
      }

      if (existing > 0) {
        skipped++
        console.log(JSON.stringify({ ...logLine, status: "already_generated" }))
      } else {
        flagged++
        console.log(JSON.stringify({ ...logLine, status: "needs_generation" }))
      }
    }

    return NextResponse.json({
      success: true,
      flaggedTerms: flagged,
      skippedTerms: skipped,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] term-end-report-cards failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
