// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { serveReportCardPdf } from "@/lib/report-card-pdf"

import { authenticate } from "../../../../mobile/lib/authenticate"

/**
 * GET /api/parent/report-cards/:id/download
 *
 * Single download gate for ReportCard PDFs, used by:
 *   - Parent web surface (`/parent/children/[id]/report-cards`)
 *   - Mobile app (Bearer JWT)
 *
 * Flow:
 *   1. Resolve identity (NextAuth session for web, JWT for mobile).
 *   2. `serveReportCardPdf` (src/lib/report-card-pdf.ts): tenant-scoped
 *      lookup, published + canAccessStudent gates, 15-minute signed URL
 *      302 — shared with GET /api/mobile/report-cards/:id/pdf.
 *
 * The raw `pdfUrl` is never returned to the client — that's the whole
 * point of having this endpoint. Even when the underlying S3 object
 * has a public ACL (legacy default), this gate stops the URL from
 * leaking via screenshots / forwarded emails.
 *
 * If the PDF hasn't been rendered yet (cron hasn't picked it up), we
 * return 425 Too Early so the client can re-poll later.
 */

interface CallerIdentity {
  userId: string
  schoolId: string
  role: string
}

async function resolveCaller(
  request: NextRequest
): Promise<CallerIdentity | NextResponse> {
  // Try NextAuth session first (web path).
  const session = await auth()
  if (session?.user?.id && session.user.schoolId) {
    return {
      userId: session.user.id,
      schoolId: session.user.schoolId,
      role: String(session.user.role ?? ""),
    }
  }

  // Fall back to the mobile bearer token — through `authenticate()`, so a
  // revoked (logged-out) token or a suspended user is refused here too.
  return authenticate(request)
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const caller = await resolveCaller(request)
  if (caller instanceof NextResponse) return caller

  return serveReportCardPdf(caller, id)
}
