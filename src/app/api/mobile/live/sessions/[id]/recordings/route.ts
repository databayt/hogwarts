// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { canAccessSession } from "@/components/school-dashboard/live/actions/helpers"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

/**
 * A session's recordings — `listRecordings`, with the JWT's actor in place of
 * the web session.
 *
 * The enrolment gate is the web's own `canAccessSession`: staff school-wide, a
 * student or guardian only their own section, and any member of the school for
 * a school-wide session. Without it any student could pull another section's
 * recording inside the same school.
 *
 * Display fields only. The S3 bucket, key and region never leave the server —
 * playback goes through `/api/mobile/live/recordings/:id/url`, which signs a
 * fresh URL per request.
 *
 * GET /api/mobile/live/sessions/:id/recordings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId, role } = auth
    const { id: sessionId } = await params

    const session = await db.conference.findFirst({
      where: { id: sessionId, schoolId, deletedAt: null },
      select: { sectionId: true, visibility: true },
    })
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const actor = { userId, role: role as UserRole, schoolId }
    if (!(await canAccessSession(actor, session.sectionId, session.visibility))) {
      // Not "forbidden": a reader who may not see the session should not
      // learn that it exists.
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const recordings = await db.conferenceRecording.findMany({
      where: { schoolId, sessionId, deletedAt: null },
      select: {
        id: true,
        sessionId: true,
        status: true,
        durationSeconds: true,
        fileSizeBytes: true,
        mimeType: true,
        startedAt: true,
        completedAt: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      data: recordings.map((recording) => ({
        id: recording.id,
        session_id: recording.sessionId,
        status: recording.status,
        duration_seconds: recording.durationSeconds,
        file_size_bytes: recording.fileSizeBytes
          ? Number(recording.fileSizeBytes)
          : null,
        mime_type: recording.mimeType,
        started_at: recording.startedAt?.toISOString() ?? null,
        completed_at: recording.completedAt?.toISOString() ?? null,
        expires_at: recording.expiresAt?.toISOString() ?? null,
        created_at: recording.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("[mobile/live/sessions/:id/recordings] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
