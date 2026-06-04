// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getProvider } from "@/components/file/providers/factory"

import { verifyToken } from "../../../mobile/auth/jwt"
import { canAccessStudent } from "../../../mobile/lib/student-access"

/**
 * GET /api/certificates/:id/download
 *
 * Authorized download gate for issued ExamCertificate PDFs, used by:
 *   - School dashboard (admin/staff/teacher web session)
 *   - Student / guardian web surface
 *   - Mobile app (Bearer JWT)
 *
 * Flow:
 *   1. Resolve identity (NextAuth session for web, JWT for mobile).
 *   2. Look up the certificate scoped by schoolId (tenant safety) — a
 *      caller in school A hitting a cert id from school B gets a clean
 *      404 rather than 403, so cross-tenant ids aren't confirmed.
 *   3. Verify the caller can access the certificate's student via
 *      canAccessStudent (staff in school; the student; a linked guardian).
 *   4. 425 Too Early if the PDF hasn't been rendered yet (cron pending).
 *   5. Sign the S3 URL (15-min TTL) and 302 redirect; fall back to the
 *      raw URL if the provider can't sign.
 *
 * NOTE: this is the AUTHORIZED path. The public share page downloads the
 * already-public `pdfUrl` directly via the unguessable share token and
 * never hits this route.
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
  // Web session first.
  const session = await auth()
  if (session?.user?.id && session.user.schoolId) {
    return {
      userId: session.user.id,
      schoolId: session.user.schoolId,
      role: String(session.user.role ?? ""),
    }
  }

  // Mobile JWT fallback.
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

  const certificate = await db.examCertificate.findFirst({
    where: { id, schoolId: caller.schoolId },
    select: {
      id: true,
      studentId: true,
      pdfUrl: true,
      status: true,
    },
  })

  if (!certificate) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (certificate.status === "revoked") {
    return NextResponse.json({ error: "Certificate revoked" }, { status: 403 })
  }

  const allowed = await canAccessStudent(
    {
      userId: caller.userId,
      email: "",
      schoolId: caller.schoolId,
      role: caller.role,
    },
    certificate.studentId
  )
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!certificate.pdfUrl) {
    // Render cron hasn't run yet. 425 Too Early → client backs off & retries.
    return NextResponse.json(
      { error: "PDF not yet generated", retryAfterSeconds: 60 },
      { status: 425, headers: { "Retry-After": "60" } }
    )
  }

  try {
    const provider = getProvider("aws_s3")
    if (!provider.getSignedUrl) {
      return NextResponse.redirect(certificate.pdfUrl, 302)
    }
    const signed = await provider.getSignedUrl(
      certificate.pdfUrl,
      SIGNED_URL_TTL_SECONDS
    )
    return NextResponse.redirect(signed, 302)
  } catch (error) {
    console.error("[certificate download] signing failed:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
