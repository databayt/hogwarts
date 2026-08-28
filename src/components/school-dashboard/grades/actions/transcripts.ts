"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { checkRateLimitAsync, RATE_LIMITS } from "@/lib/rate-limit"
import { getTenantContext } from "@/lib/tenant-context"

import { gradesPath } from "../lib/paths"
import { generateTranscriptCore } from "../lib/transcripts-core"

// Issuing an official, externally-verifiable document is a staff action — it
// mints a public verification code against a named student's record.
const TRANSCRIPT_ROLES: ReadonlySet<string> = new Set([
  "ADMIN",
  "DEVELOPER",
  "TEACHER",
])

// ============================================================================
// GENERATE TRANSCRIPT
// ============================================================================

/**
 * Tenant-authed wrapper around `generateTranscriptCore`. The aggregation lives
 * in the plain core (`grades/lib/transcripts-core.ts`) so the demo seed — and
 * any future cron or bulk issuer — can call it with an explicit `schoolId`;
 * here we resolve the tenant from the session and delegate.
 */
export async function generateTranscript(input: {
  studentId: string
}): Promise<ActionResponse<{ id: string; transcriptNumber: string }>> {
  const session = await auth()
  if (!session?.user) return { success: false, error: "Not authenticated" }
  if (!TRANSCRIPT_ROLES.has(session.user.role ?? "")) {
    return { success: false, error: "Unauthorized" }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return { success: false, error: "Missing school context" }

  const res = await generateTranscriptCore(schoolId, {
    studentId: input.studentId,
    generatedBy: session.user.id || "",
  })
  if (res.success) revalidatePath(gradesPath("transcripts"), "page")
  return res
}

// ============================================================================
// VERIFY TRANSCRIPT (public)
// ============================================================================

export async function verifyTranscript(input: { verificationCode: string }) {
  try {
    // Public, unauthenticated endpoint that returns student PII (name, GPA,
    // credits) for a valid code. Rate-limit per IP so verification codes can't
    // be brute-force enumerated. Generic failure on limit (don't reveal why).
    const h = await headers()
    const rl = await checkRateLimitAsync(
      { headers: h } as unknown as NextRequest,
      RATE_LIMITS.PUBLIC,
      "verify-transcript"
    )
    if (!rl.allowed) {
      return { valid: false, error: "Verification failed" }
    }

    const transcript = await db.transcript.findUnique({
      where: { verificationCode: input.verificationCode },
      select: {
        transcriptNumber: true,
        studentName: true,
        cumulativeGPA: true,
        totalCredits: true,
        createdAt: true,
        school: { select: { name: true } },
      },
    })

    if (!transcript) {
      return { valid: false, error: "Transcript not found" }
    }

    return {
      valid: true,
      data: {
        transcriptNumber: transcript.transcriptNumber,
        studentName: transcript.studentName,
        schoolName: transcript.school.name,
        cumulativeGPA: transcript.cumulativeGPA
          ? Number(transcript.cumulativeGPA)
          : null,
        totalCredits: transcript.totalCredits
          ? Number(transcript.totalCredits)
          : null,
        issuedDate: transcript.createdAt.toISOString(),
      },
    }
  } catch {
    return { valid: false, error: "Verification failed" }
  }
}

// ============================================================================
// GET TRANSCRIPTS
// ============================================================================

export async function getTranscripts(input?: { search?: string }) {
  const session = await auth()
  if (!session?.user) return []
  const { schoolId } = await getTenantContext()
  if (!schoolId) return []

  const where: Record<string, unknown> = { schoolId }
  if (input?.search) {
    where.studentName = { contains: input.search, mode: "insensitive" }
  }

  return db.transcript.findMany({
    where,
    select: {
      id: true,
      studentName: true,
      transcriptNumber: true,
      cumulativeGPA: true,
      totalCredits: true,
      pdfUrl: true,
      createdAt: true,
      student: {
        select: { studentId: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}
