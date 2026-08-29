// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import {
  extractStorageKey,
  getSignedReadUrl,
  SIGNED_READ_TTL_SECONDS,
} from "@/lib/s3"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * GET /api/lumos/file/[kind]/[id]  —  kind ∈ { material, attachment }
 *
 * The document sibling of `/api/lumos/video/[videoId]`: worksheets, notes and
 * lesson attachments are school work product too, and they were served from
 * the same world-readable storage URLs. Same shape of fix — the page carries
 * an opaque reference, this route re-authorizes, and the signed URL is minted
 * per request.
 *
 * Unlike video, these are *meant* to be downloaded, so the signed URL carries
 * a Content-Disposition filename. The protection here is about who may fetch
 * them, not about stopping a save.
 *
 * Two opt-in modes for callers that are not a browser's save dialog:
 *   `?inline=1` — redirect without the attachment disposition, so a PDF opens
 *                 in the viewer (and pdf.js can render it in the live room).
 *   `?ticket=1` — answer JSON `{ url, filename, contentType }` instead of
 *                 redirecting, for the offline download manager, which needs
 *                 the signed URL itself to fetch the bytes into IndexedDB.
 */

const KINDS = new Set(["material", "attachment"])

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> }
): Promise<NextResponse> {
  const { kind, id } = await params
  const inline = req.nextUrl.searchParams.get("inline") === "1"
  const ticket = req.nextUrl.searchParams.get("ticket") === "1"

  if (!KINDS.has(kind)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

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

  const resolved =
    kind === "material"
      ? await resolveMaterial(id, session.user.id, schoolId)
      : await resolveAttachment(id)

  if (!resolved) {
    return NextResponse.json({ error: "Not available" }, { status: 403 })
  }

  const signedUrl = await getSignedReadUrl(
    resolved.key,
    SIGNED_READ_TTL_SECONDS,
    inline || ticket
      ? { contentType: resolved.contentType }
      : {
          downloadFilename: resolved.filename,
          contentType: resolved.contentType,
        }
  )
  if (!signedUrl) {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 })
  }

  const noStore = { "Cache-Control": "private, no-store, max-age=0" }

  if (ticket) {
    return NextResponse.json(
      {
        url: signedUrl,
        expiresAt: new Date(
          Date.now() + SIGNED_READ_TTL_SECONDS * 1000
        ).toISOString(),
        filename: resolved.filename,
        contentType: resolved.contentType ?? null,
      },
      { headers: noStore }
    )
  }

  return NextResponse.redirect(signedUrl, { status: 302, headers: noStore })
}

type ResolvedFile = {
  key: string
  filename: string
  contentType?: string
}

/**
 * Materials repeat the gate the lesson query applies: approved + published,
 * and either PUBLIC or contributed by the viewer's own school. The
 * contributor keeps access to their own submission while it is still in
 * review, which is how they check what they uploaded.
 */
async function resolveMaterial(
  id: string,
  userId: string,
  schoolId: string | null
): Promise<ResolvedFile | null> {
  const material = await db.material.findUnique({
    where: { id },
    select: {
      title: true,
      fileKey: true,
      fileUrl: true,
      mimeType: true,
      status: true,
      visibility: true,
      approvalStatus: true,
      contributedBy: true,
      contributedSchoolId: true,
    },
  })
  if (!material) return null

  const key = material.fileKey || extractStorageKey(material.fileUrl ?? "")
  if (!key) return null

  const isContributor = material.contributedBy === userId
  const isOwnSchool = !!schoolId && material.contributedSchoolId === schoolId

  const publiclyVisible =
    material.approvalStatus === "APPROVED" &&
    material.status === "PUBLISHED" &&
    (material.visibility === "PUBLIC" || isOwnSchool)

  if (!publiclyVisible && !isContributor) return null

  return {
    key,
    filename: material.title,
    contentType: material.mimeType ?? undefined,
  }
}

/**
 * Attachments carry no visibility column of their own — they belong to a
 * published catalog lesson, which is the unit of access. Matching the lesson
 * query, any signed-in viewer of a published lesson may fetch them; the
 * uploader keeps access while the lesson is still a draft.
 */
async function resolveAttachment(id: string): Promise<ResolvedFile | null> {
  const attachment = await db.attachment.findUnique({
    where: { id },
    select: {
      name: true,
      url: true,
      fileType: true,
      lesson: { select: { status: true } },
    },
  })
  if (!attachment) return null

  if (attachment.lesson?.status !== "PUBLISHED") return null

  const key = extractStorageKey(attachment.url)
  if (!key) return null

  return {
    key,
    filename: attachment.name,
    contentType: attachment.fileType ?? undefined,
  }
}
