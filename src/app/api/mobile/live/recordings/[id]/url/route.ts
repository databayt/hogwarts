// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"
import { canAccessSession } from "@/components/school-dashboard/live/actions/helpers"
import { getRecordingPlaybackUrl } from "@/components/school-dashboard/live/livekit/recording-urls"

import { authenticate, isAuthError } from "../../../../lib/authenticate"

/**
 * A fresh signed URL for one recording — `getRecordingUrl` with the JWT's
 * actor. The signature is never stored: every play request gets its own.
 *
 * The TTL is the web's four hours, for the web's reason: swapping the URL
 * mid-playback reloads the player and drops the viewer back to 0:00, so it has
 * to outlast the longest realistic sitting rather than lean on a refresh.
 *
 * GET /api/mobile/live/recordings/:id/url
 */
const PLAYBACK_TTL_SECONDS = 4 * 3600

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId, role } = auth
    const { id } = await params

    const recording = await db.conferenceRecording.findFirst({
      where: { id, schoolId, status: "ready", deletedAt: null },
      select: {
        s3Bucket: true,
        s3Key: true,
        s3Region: true,
        mimeType: true,
        session: { select: { sectionId: true, visibility: true } },
      },
    })
    if (!recording) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 })
    }

    const actor = { userId, role: role as UserRole, schoolId }
    const allowed = await canAccessSession(
      actor,
      recording.session?.sectionId ?? null,
      recording.session?.visibility ?? "section"
    )
    // A recording the reader may not open reads as missing, exactly as it does
    // on the web — the alternative tells them whose class it was.
    if (!allowed) {
      return NextResponse.json({ error: "Recording not found" }, { status: 404 })
    }

    const url = await getRecordingPlaybackUrl(recording, PLAYBACK_TTL_SECONDS)

    return NextResponse.json(
      { url, expires_in: PLAYBACK_TTL_SECONDS },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("[mobile/live/recordings/:id/url] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
