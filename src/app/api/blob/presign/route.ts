// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Presigned URL API — Direct-to-S3 upload for large videos
 *
 * Client requests a presigned PUT URL, then uploads directly to S3.
 * This bypasses the server for file bytes, avoiding memory/timeout issues
 * for large video files (>100MB up to 5GB).
 *
 * Flow:
 * 1. Client POST /api/blob/presign with { filename, contentType, size }
 * 2. Server generates presigned S3 PUT URL (15 min expiry)
 * 3. Client uploads directly to S3 via PUT with presigned URL
 * 4. Client sends final URL back to lesson form
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { deleteObject } from "@/lib/s3"
import { getTenantContext } from "@/lib/tenant-context"
import { presignUpload } from "@/lib/upload/presign"

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    // 2. Authorization
    if (!["TEACHER", "ADMIN", "DEVELOPER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // 3. Multi-tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId && session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "School context required" },
        { status: 400 }
      )
    }

    // 4. Validate + mint — MIME allowlist, 5GB cap, quota pre-check and the
    // `stream/<schoolId>/video/` key live in src/lib/upload/presign.ts.
    const body = (await request.json()) as {
      filename?: unknown
      contentType?: unknown
      size?: unknown
    }
    const out = await presignUpload({
      kind: "video",
      schoolId,
      filename: body.filename,
      contentType: body.contentType,
      size: body.size,
    })
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: out.status })
    }

    // The stored URL is the bucket's own S3 URL, never a delivery URL: reads go
    // through /api/lumos/video/<id>, which authorizes and then signs
    // `storageKey`. (It used to prefer CLOUDFRONT_DOMAIN, which fronts a
    // different bucket, so every upload recorded a URL that 403'd.)
    return NextResponse.json({
      presignedUrl: out.presignedUrl,
      finalUrl: out.finalUrl,
      key: out.key,
      storageProvider: "aws_s3",
      expiresIn: out.expiresIn,
    })
  } catch (error) {
    console.error("Presigned URL generation failed:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}

/**
 * Abandoned-upload cleanup — delete an uploaded object that was never
 * submitted as a video. Guards:
 * - same auth/roles as POST
 * - the key must live under the caller's own upload prefix
 *   (`stream/<schoolId>/video/`, or `stream/platform/video/` for DEVELOPER)
 * - refuses when a Video row references the key (that file is live content;
 *   deleting it belongs to `deleteOwnVideo`, which also releases quota)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    if (!["TEACHER", "ADMIN", "DEVELOPER"].includes(session.user.role || "")) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId && session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "School context required" },
        { status: 400 }
      )
    }

    const body = (await request.json()) as { key?: string }
    const key = body.key?.trim()
    if (!key) {
      return NextResponse.json(
        { error: "Missing required field: key" },
        { status: 400 }
      )
    }

    const allowedPrefix = `stream/${schoolId ?? "platform"}/video/`
    if (!key.startsWith(allowedPrefix) || key.includes("..")) {
      return NextResponse.json(
        { error: "Key outside your upload scope" },
        { status: 403 }
      )
    }

    const inUse = await db.video.findFirst({
      where: { storageKey: key },
      select: { id: true },
    })
    if (inUse) {
      return NextResponse.json(
        { error: "Object is referenced by a video" },
        { status: 409 }
      )
    }

    const deleted = await deleteObject(key)
    return NextResponse.json({ deleted })
  } catch (error) {
    console.error("Upload cleanup failed:", error)
    return NextResponse.json({ error: "Failed to clean up" }, { status: 500 })
  }
}
