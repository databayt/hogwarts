// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { renderAndUploadReportCardPdf } from "@/components/file/generate/render-report-card-pdf"

/**
 * Cron — process published ReportCards that don't yet have a PDF.
 *
 * Schedule: every 5 minutes (see vercel.json). Batch size 20 to keep
 * each invocation under the Vercel function timeout — @react-pdf/renderer
 * is CPU+memory heavy and a 600-student school taking 30s per render
 * would otherwise time out the whole batch.
 *
 * Registered as the long-term home for ReportCard PDF generation; the
 * sync path in `school-dashboard/reports/actions.ts > generateReportCards`
 * is being deprecated.
 *
 * Auth: shared CRON_SECRET pattern, same as the other crons in this dir.
 *
 * Structured logs: emit per-card outcome with `action`, `reportCardId`,
 * `studentId`, `termId`, `durationMs`, `ok` so operators can trace
 * timeouts without diving into traces.
 */
const BATCH_SIZE = 20

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startedAt = Date.now()

  try {
    // Pull a small batch of "ready to render" cards. The selector is the
    // contract: published + missing pdfUrl. Anything published with a
    // pdfUrl is considered done.
    const pending = await db.reportCard.findMany({
      where: { isPublished: true, pdfUrl: null },
      select: { id: true, studentId: true, termId: true, schoolId: true },
      take: BATCH_SIZE,
      // FIFO so a backlog drains in publish order.
      orderBy: { publishedAt: "asc" },
    })

    if (pending.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
        timestamp: new Date().toISOString(),
      })
    }

    let succeeded = 0
    let failed = 0

    for (const rc of pending) {
      const result = await renderAndUploadReportCardPdf(rc.id)
      // Structured log — one line per card so this is grep-able in
      // Vercel logs without a separate ingestion pipeline.
      console.log(
        JSON.stringify({
          action: "report_card_pdf_render",
          reportCardId: rc.id,
          studentId: rc.studentId,
          termId: rc.termId,
          schoolId: rc.schoolId,
          ok: result.ok,
          durationMs: result.durationMs,
          reason: result.reason,
        })
      )
      if (result.ok) succeeded++
      else failed++
    }

    return NextResponse.json({
      success: true,
      processed: pending.length,
      succeeded,
      failed,
      durationMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[Cron] process-report-card-pdfs failed:", error)
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
