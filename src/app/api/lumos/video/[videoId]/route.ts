// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { getSignedReadUrl, SIGNED_READ_TTL_SECONDS } from "@/lib/s3"
import { getTenantContext } from "@/lib/tenant-context"
import {
  denialStatus,
  resolveVideoAccess,
} from "@/components/lumos/video/media-access"

/**
 * GET /api/lumos/video/[videoId]
 *
 * The only way a lesson video's bytes are reachable. The lesson page ships
 * this reference instead of a storage URL, so nothing durable and nothing
 * fetchable-by-strangers appears in the HTML, the RSC payload, or a shared
 * link. Each request re-runs the full visibility/purchase gate and then
 * redirects to a signed URL that expires the same session.
 *
 * A GET route handler rather than a server action on purpose: `auth()` rotates
 * the session cookie inside action requests, which makes Next ship a full RSC
 * re-render (~1MB) with every response — ruinous for something the player may
 * call again mid-playback. See the same reasoning on the notifications bell.
 *
 * The redirect target is still a bearer URL for its lifetime, which is the
 * honest limit of this approach: it turns "public forever, to anyone" into
 * "this viewer, for a couple of hours". Screen recording remains out of scope
 * for anything short of EME/DRM — the watermark is what covers that case.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
): Promise<NextResponse> {
  const { videoId } = await params

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const rl = await checkUserRateLimit(
    session.user.id,
    RATE_LIMITS.LUMOS_MEDIA,
    "lumos-media"
  )
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { schoolId } = await getTenantContext()

  const access = await resolveVideoAccess({
    videoId,
    userId: session.user.id,
    schoolId,
    // Lets a reviewer play the PENDING video they are being asked to judge.
    role: session.user.role,
  })

  if (!access.ok) {
    // Deliberately terse: a viewer who may not have the video learns nothing
    // about whether it exists, who owns it, or what it costs.
    return NextResponse.json(
      { error: "Not available" },
      { status: denialStatus(access.reason) }
    )
  }

  const signedUrl = await getSignedReadUrl(
    access.storageKey,
    SIGNED_READ_TTL_SECONDS
  )
  if (!signedUrl) {
    return NextResponse.json(
      { error: "Media temporarily unavailable" },
      { status: 503 }
    )
  }

  // 302, never 301 — a permanent redirect would pin this viewer to one signed
  // URL forever and skip the authorization check on every later play.
  //
  // The short private max-age is deliberate, not a weakening. A media element
  // re-requests this URL on seeks and re-buffers; with `no-store` a heavy
  // scrubbing session would re-authorize dozens of times and trip the rate
  // limit mid-lesson. Caching the redirect briefly cannot widen access
  // either way, because the URL it points at is already valid for
  // SIGNED_READ_TTL_SECONDS — the redirect is never the shorter-lived half.
  return NextResponse.redirect(signedUrl, {
    status: 302,
    headers: {
      "Cache-Control": "private, max-age=60",
    },
  })
}
