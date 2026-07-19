// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { generateReportCardsCore } from "@/components/school-dashboard/grades/lib/report-cards-core"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // Vercel Pro: bulk report-card aggregation

/**
 * Cron — auto-generate report cards for terms that ended yesterday.
 *
 * Schedule: daily at 03:00 server time (see vercel.json). For each term whose
 * `endDate` was within the last 36 hours and which has zero ReportCard rows
 * yet, we aggregate the term's results into `ReportCard` + `ReportCardGrade`
 * rows via `generateReportCardsCore` (the plain core shared with the admin
 * action). We do NOT publish — the admin reviews the drafts in `/grades/reports`
 * and clicks Publish; the `process-report-card-pdfs` cron then renders PDFs.
 *
 * Defensive: only generates when there is no existing ReportCard for the term,
 * so a term the admin already processed is never clobbered. The window is wider
 * than 24h so a single missed run doesn't drop a term silently.
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

    // Terms whose endDate falls in the last 36h.
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
        generatedTerms: 0,
        skippedTerms: 0,
        failedTerms: 0,
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      })
    }

    let generatedTerms = 0
    let skipped = 0
    let failed = 0

    for (const term of recentlyEnded) {
      const existing = await db.reportCard.count({
        where: { schoolId: term.schoolId, termId: term.id },
      })

      const logLine = {
        action: "term_end_report_card_generate",
        schoolId: term.schoolId,
        termId: term.id,
        termNumber: term.termNumber,
        endDate: term.endDate.toISOString(),
      }

      // Never clobber a term the admin already processed.
      if (existing > 0) {
        skipped++
        console.log(
          JSON.stringify({
            ...logLine,
            status: "already_generated",
            existingReportCards: existing,
          })
        )
        continue
      }

      const res = await generateReportCardsCore(term.schoolId, {
        termId: term.id,
      })
      if (res.success && res.data) {
        generatedTerms++
        console.log(
          JSON.stringify({ ...logLine, status: "generated", ...res.data })
        )
      } else {
        failed++
        console.log(
          JSON.stringify({
            ...logLine,
            status: "failed",
            error: !res.success ? res.error : undefined,
          })
        )
      }
    }

    return NextResponse.json({
      success: true,
      generatedTerms,
      skippedTerms: skipped,
      failedTerms: failed,
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
