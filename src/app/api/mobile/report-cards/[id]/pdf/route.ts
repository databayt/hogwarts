// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest } from "next/server"

import { serveReportCardPdf } from "@/lib/report-card-pdf"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * GET /api/mobile/report-cards/:id/pdf — the report card PDF
 *
 * 302 to a 15-minute signed URL (follow the redirect / hand it to a download
 * manager). 404 when the card is not in this school, 403 when unpublished or
 * not the caller's student, 425 + Retry-After while the PDF is still being
 * rendered. Same gate as /api/parent/report-cards/:id/download.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request)
  if (isAuthError(auth)) return auth

  const { id } = await params
  return serveReportCardPdf(auth, id)
}
