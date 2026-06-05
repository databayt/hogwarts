// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { after, NextResponse } from "next/server"
import { ComplianceSubmissionStatus, ConnectorMode } from "@prisma/client"

import {
  enqueueDailySubmissions,
  maybeRecloseCircuitBreakers,
  processSubmission,
} from "@/lib/compliance/orchestrator"
import { isAuthorizedCron } from "@/lib/cron-auth"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * Daily ADEK eSIS submission cron.
 *
 * Schedule: 0 10 * * * (10:00 UTC = 14:00 GST — ADEK requirement)
 * Configured in vercel.json.
 *
 * Step 1: enqueue today's submission row for every eligible school
 *         (DRY_RUN, PIGGYBACK, OFFICIAL_API, RPA — DISABLED is skipped).
 * Step 2: for non-RPA modes, kick off `processSubmission` via `after()` so
 *         the cron HTTP returns quickly. RPA submissions stay QUEUED for
 *         the external worker to claim.
 * Step 3: opportunistically re-close circuit breakers whose cooldown elapsed.
 */
export async function GET(request: Request) {
  if (!isAuthorizedCron(request, "esis-submit")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await maybeRecloseCircuitBreakers()
    const { queued, skipped } = await enqueueDailySubmissions(new Date())

    // Hand off non-RPA submissions to background execution
    if (queued > 0) {
      const queuedSubmissions = await db.complianceSubmission.findMany({
        where: {
          status: ComplianceSubmissionStatus.QUEUED,
          mode: {
            in: [
              ConnectorMode.DRY_RUN,
              ConnectorMode.PIGGYBACK,
              ConnectorMode.OFFICIAL_API,
            ],
          },
        },
        select: { id: true },
        take: 200, // Safety cap
      })
      for (const { id } of queuedSubmissions) {
        after(async () => {
          try {
            await processSubmission(id)
          } catch (error) {
            console.error(
              `[cron/esis-submit] processSubmission(${id}) threw:`,
              error
            )
          }
        })
      }
    }

    return NextResponse.json({ ok: true, queued, skipped })
  } catch (error) {
    console.error("[cron/esis-submit] Failed:", error)
    return NextResponse.json(
      {
        error: "Internal error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
