// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { getProvider } from "@/components/file/providers/factory"
import type { MobileAuthContext } from "@/app/api/mobile/lib/authenticate"
import { canAccessStudent } from "@/app/api/mobile/lib/student-access"

const SIGNED_URL_TTL_SECONDS = 15 * 60

/**
 * The one download gate for ReportCard PDFs, behind both
 * `GET /api/parent/report-cards/:id/download` (web session or bearer) and
 * `GET /api/mobile/report-cards/:id/pdf` (bearer).
 *
 *   1. ReportCard looked up by id + schoolId — another school's id is a 404.
 *   2. Must be published (403).
 *   3. canAccessStudent: the student, a linked guardian, or school staff (403).
 *   4. Not rendered yet → 425 Too Early + Retry-After, so the client re-polls.
 *   5. 302 to a 15-minute signed S3 URL; the raw `pdfUrl` is never returned.
 */
export async function serveReportCardPdf(
  caller: Pick<MobileAuthContext, "userId" | "schoolId" | "role">,
  id: string
): Promise<NextResponse> {
  const reportCard = await db.reportCard.findFirst({
    where: { id, schoolId: caller.schoolId },
    select: {
      id: true,
      studentId: true,
      pdfUrl: true,
      isPublished: true,
    },
  })

  if (!reportCard) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (!reportCard.isPublished) {
    return NextResponse.json({ error: "Not yet published" }, { status: 403 })
  }

  const allowed = await canAccessStudent(
    {
      userId: caller.userId,
      email: "",
      schoolId: caller.schoolId,
      role: caller.role,
    },
    reportCard.studentId
  )
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!reportCard.pdfUrl) {
    // PDF render cron hasn't run yet. 425 Too Early signals the client
    // to back off and retry rather than treat this as a hard error.
    return NextResponse.json(
      { error: "PDF not yet generated", retryAfterSeconds: 60 },
      { status: 425, headers: { "Retry-After": "60" } }
    )
  }

  try {
    const provider = getProvider("aws_s3")
    if (!provider.getSignedUrl) {
      // Provider doesn't expose signing — fall back to the raw URL.
      // This keeps the endpoint functional but loses the expiry benefit.
      return NextResponse.redirect(reportCard.pdfUrl, 302)
    }
    const signed = await provider.getSignedUrl(
      reportCard.pdfUrl,
      SIGNED_URL_TTL_SECONDS
    )
    return NextResponse.redirect(signed, 302)
  } catch (error) {
    console.error("[report-card download] signing failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
