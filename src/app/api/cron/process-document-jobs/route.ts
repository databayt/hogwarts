// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { verifyCronSecret } from "@/lib/cron-auth"
import { processNextJobs } from "@/lib/document-extraction/queue-runner"

/**
 * Cron job: process pending document AI jobs.
 *
 * Picks up PENDING DocumentProcessingJob rows (admission documents, bank
 * receipts, etc.), runs the registered handler for each, manages retries,
 * and records AI usage against the school's monthly budget.  Decoupling
 * heavy AI work from the request cycle avoids serverless timeouts.
 *
 * Schedule: see vercel.json crons (entry: /api/cron/process-document-jobs).
 * Auth: CRON_SECRET bearer token (same pattern as all other cron routes).
 */
export async function GET(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await processNextJobs({ maxJobs: 5 })
    console.log(
      `[Cron] process-document-jobs: processed=${result.processed} succeeded=${result.succeeded} failed=${result.failed} skipped=${result.skipped}`
    )
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[Cron] process-document-jobs failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process document jobs" },
      { status: 500 }
    )
  }
}
