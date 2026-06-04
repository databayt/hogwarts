// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { renderPendingCertificatePDFs } from "@/components/school-dashboard/grades/actions/certificate-pdf"

/**
 * Cron job: render queued certificate PDFs.
 *
 * Picks up certificates that were issued (e.g. via autoGenerateCertificates /
 * batch issue) but don't have a rendered `pdfUrl` yet, renders them with the
 * composable template, uploads to S3, and persists the URL. Decoupling the
 * (heavy, React-PDF) render from the request avoids serverless timeouts on
 * large classes; `limit` caps work per run.
 *
 * Schedule: every 6 hours (see vercel.json crons).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await renderPendingCertificatePDFs({ limit: 25 })
    console.log(
      `[Cron] process-certificate-pdfs: processed=${result.processed} generated=${result.generated} failed=${result.failed}`
    )
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[Cron] process-certificate-pdfs failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to process certificate PDFs" },
      { status: 500 }
    )
  }
}
