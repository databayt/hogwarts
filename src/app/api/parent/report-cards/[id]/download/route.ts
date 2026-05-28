// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getProvider } from "@/components/file/providers/factory"

import { verifyToken } from "../../../../mobile/auth/jwt"
import { canAccessStudent } from "../../../../mobile/lib/student-access"

/**
 * GET /api/parent/report-cards/:id/download
 *
 * Single download gate for ReportCard PDFs, used by:
 *   - Parent web surface (`/parent/children/[id]/report-cards`)
 *   - Mobile app (Bearer JWT)
 *
 * Flow:
 *   1. Resolve identity (NextAuth session for web, JWT for mobile).
 *   2. Look up ReportCard scoped by schoolId (tenant safety).
 *   3. Verify the caller can access this student via canAccessStudent
 *      (STUDENT must own; GUARDIAN must be linked via StudentGuardian;
 *      staff roles allowed within their school).
 *   4. Sign the S3 URL with a 15-minute TTL and 302 redirect.
 *
 * The raw `pdfUrl` is never returned to the client — that's the whole
 * point of having this endpoint. Even when the underlying S3 object
 * has a public ACL (legacy default), this gate stops the URL from
 * leaking via screenshots / forwarded emails.
 *
 * If the PDF hasn't been rendered yet (cron hasn't picked it up), we
 * return 425 Too Early so the client can re-poll later.
 */

const SIGNED_URL_TTL_SECONDS = 15 * 60

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

  // Fall back to JWT bearer (mobile). We don't reuse the mobile
  // `authenticate()` helper because it returns NextResponse on failure
  // — we'd need to unwrap to allow either auth path.
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const { payload } = await verifyToken(token)
    const schoolId = payload.schoolId as string | null
    if (!schoolId) {
      return NextResponse.json({ error: "No school context" }, { status: 400 })
    }
    return {
      userId: payload.sub as string,
      schoolId,
      role: (payload.role as string) || "",
    }
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const caller = await resolveCaller(request)
  if (caller instanceof NextResponse) return caller

  // ReportCard is fetched with schoolId match so a guardian in school A
  // hitting a card id from school B gets a clean 404 rather than 403
  // (avoids info-leaking that an id exists across tenants).
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
