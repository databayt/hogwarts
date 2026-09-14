// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { presignUpload, type UploadKind } from "@/lib/upload/presign"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { hasRole } from "../../lib/roles"

const PURPOSES: UploadKind[] = ["attachment", "payment_proof", "video"]

/**
 * POST /api/mobile/upload/presign — direct-to-S3 upload URL (bearer token)
 *
 * Body: { purpose: "attachment" | "payment_proof" | "video", filename,
 *         content_type, size, scope? }
 * Returns: { upload_url, file_url, key, expires_in, method: "PUT",
 *            headers: { "Content-Type": content_type } }
 *
 * PUT the bytes to `upload_url` with that Content-Type (and the exact
 * Content-Length announced as `size`), then send `file_url` to the record
 * route — e.g. `attachments` on POST /api/mobile/assignments/:id/submissions.
 *
 * Same rules as the web presign routes (src/lib/upload/presign.ts): per-purpose
 * MIME allowlist and size cap (attachment 25MB, payment_proof 10MB, video 5GB),
 * key under `<prefix>/<schoolId>/`. `video` is TEACHER/ADMIN/DEVELOPER, as on
 * the web. An attachment is filed under the uploader's own user id.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    let body: {
      purpose?: unknown
      filename?: unknown
      content_type?: unknown
      size?: unknown
      scope?: unknown
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    const purpose = body.purpose as UploadKind
    if (!PURPOSES.includes(purpose)) {
      return NextResponse.json(
        { error: "purpose must be attachment, payment_proof or video" },
        { status: 400 }
      )
    }
    if (
      purpose === "video" &&
      !hasRole(auth, "TEACHER", "ADMIN", "DEVELOPER")
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const out = await presignUpload({
      kind: purpose,
      schoolId: auth.schoolId,
      filename: body.filename,
      contentType: body.content_type,
      size: body.size,
      scope:
        purpose === "attachment"
          ? auth.userId
          : typeof body.scope === "string"
            ? body.scope
            : null,
    })
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: out.status })
    }

    return NextResponse.json({
      upload_url: out.presignedUrl,
      file_url: out.finalUrl,
      key: out.key,
      expires_in: out.expiresIn,
      method: "PUT",
      headers: { "Content-Type": body.content_type },
    })
  } catch (error) {
    console.error("Mobile upload presign error:", error)
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    )
  }
}
