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
 * GET /api/lumos/video/[videoId]/download
 *
 * The offline-download ticket for a lesson video. Same gate as the playback
 * route, plus the owner's `allowDownload` flag — playback rights never imply
 * a right to keep a copy.
 *
 * Answers JSON rather than redirecting: the download manager fetches the
 * signed URL itself in Range-sized chunks so an interrupted download resumes
 * where it stopped, and one ticket serves every chunk until it expires. A
 * redirect would have re-authorised (and rate-limited) every 8 MB.
 *
 * The bucket's CORS policy is what makes the direct fetch possible from the
 * tenant origins; it exposes Content-Range/Accept-Ranges for the resume math.
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
    role: session.user.role,
  })

  if (!access.ok) {
    return NextResponse.json(
      { error: "Not available" },
      { status: denialStatus(access.reason) }
    )
  }

  if (!access.allowDownload) {
    // The viewer can already play this video, so naming the reason leaks
    // nothing they don't have.
    return NextResponse.json(
      { error: "Download not permitted", code: "DOWNLOAD_NOT_ALLOWED" },
      { status: 403 }
    )
  }

  const contentType = contentTypeFor(access.storageKey)
  const filename = `${safeFilename(access.title)}.${extensionFor(contentType)}`

  const signedUrl = await getSignedReadUrl(
    access.storageKey,
    SIGNED_READ_TTL_SECONDS,
    { downloadFilename: filename, contentType }
  )
  if (!signedUrl) {
    return NextResponse.json(
      { error: "Media temporarily unavailable" },
      { status: 503 }
    )
  }

  return NextResponse.json(
    {
      url: signedUrl,
      expiresAt: new Date(
        Date.now() + SIGNED_READ_TTL_SECONDS * 1000
      ).toISOString(),
      bytes: access.fileSize,
      durationSeconds: access.durationSeconds,
      filename,
      contentType,
    },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } }
  )
}

const VIDEO_TYPES: Record<string, string> = {
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mkv: "video/x-matroska",
}

function contentTypeFor(storageKey: string): string {
  const ext = storageKey.split(".").pop()?.toLowerCase() ?? ""
  return VIDEO_TYPES[ext] ?? "video/mp4"
}

function extensionFor(contentType: string): string {
  return (
    Object.entries(VIDEO_TYPES).find(([, t]) => t === contentType)?.[0] ?? "mp4"
  )
}

/** Keep letters (any script), digits, spaces and dashes; the rest is noise in a filename. */
function safeFilename(title: string): string {
  const cleaned = title
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return cleaned.slice(0, 80) || "lesson"
}
