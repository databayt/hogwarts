// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { renderAndUploadTranscriptPdf } from "@/components/file/generate/render-transcript-pdf"

export const dynamic = "force-dynamic"
export const maxDuration = 300 // Vercel Pro: @react-pdf renders are CPU/mem heavy

/**
 * Cron — render Transcript PDFs whose `pdfUrl` is null.
 *
 * Mirror of `process-report-card-pdfs`. Schedule: every 5 min, batch 10
 * (transcripts are heavier than report cards — multi-year tables — so
 * we halve the batch size to stay inside the function timeout).
 *
 * Auth: shared CRON_SECRET (constant-time bearer compare).
 */
const BATCH_SIZE = 10

function isAuthorizedCron(request: Request): boolean {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[cron/process-transcript-pdfs] CRON_SECRET unset in production — refusing"
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
    const pending = await db.transcript.findMany({
      where: { pdfUrl: null },
      select: {
        id: true,
        studentId: true,
        transcriptNumber: true,
        schoolId: true,
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    })

    if (pending.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        succeeded: 0,
        failed: 0,
        durationMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      })
    }

    let succeeded = 0
    let failed = 0

    for (const t of pending) {
      const result = await renderAndUploadTranscriptPdf(t.id)
      console.log(
        JSON.stringify({
          action: "transcript_pdf_render",
          transcriptId: t.id,
          transcriptNumber: t.transcriptNumber,
          studentId: t.studentId,
          schoolId: t.schoolId,
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
    console.error("[Cron] process-transcript-pdfs failed:", error)
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
