// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Presigned direct-to-S3 uploads — the one place that decides what may be
 * uploaded where. Shared by `/api/blob/presign` (lesson video),
 * `/api/blob/presign-payment-proof` (transfer receipts) and
 * `/api/mobile/upload/presign` (the native app, bearer token).
 *
 * Every kind carries its own MIME allowlist, size cap and TENANT-PREFIXED key
 * (`<prefix>/<schoolId>/...`), so one school's objects can never collide with
 * or be guessed from another's. Callers own authentication and role gates.
 */

import { PutObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { getS3Client } from "@/lib/s3"
import { checkSchoolVideoQuota } from "@/components/lumos/lib/quota"

export const PRESIGNED_URL_EXPIRY = 15 * 60 // 15 minutes

export type UploadKind = "video" | "payment_proof" | "attachment"

interface UploadKindSpec {
  maxBytes: number
  types: readonly string[]
  /** Shown in the 400 when the size cap is exceeded. */
  sizeLabel: string
  /** Key prefix before the file name. `scope` is sanitised by the caller. */
  prefix: (schoolId: string | null, scope: string) => string
  /** Keep the tail of long names so the extension survives. */
  nameMax?: number
  /**
   * video: the stored URL is the bucket's own S3 URL — reads go through
   * /api/lumos/video/<id>, which signs `storageKey`. Others prefer the CDN
   * domain when one is configured (the historical payment-proof shape).
   */
  finalUrl: "s3" | "cdn"
}

export const UPLOAD_KINDS: Record<UploadKind, UploadKindSpec> = {
  video: {
    maxBytes: 5 * 1024 * 1024 * 1024, // 5GB
    types: ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"],
    sizeLabel: "5GB",
    prefix: (schoolId) => `stream/${schoolId ?? "platform"}/video`,
    finalUrl: "s3",
  },
  payment_proof: {
    // A transfer screenshot is a phone screengrab or a one-page PDF.
    maxBytes: 10 * 1024 * 1024, // 10MB
    types: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ],
    sizeLabel: "10MB",
    prefix: (schoolId, scope) =>
      `payment-proof/${schoolId}/${scope || "unscoped"}`,
    nameMax: 80,
    finalUrl: "cdn",
  },
  attachment: {
    // Homework hand-ins and similar: photos of work, PDFs, office documents.
    maxBytes: 25 * 1024 * 1024, // 25MB
    types: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "audio/mpeg",
      "audio/mp4",
      "audio/aac",
    ],
    sizeLabel: "25MB",
    prefix: (schoolId, scope) => `attachments/${schoolId}/${scope || "misc"}`,
    nameMax: 80,
    finalUrl: "s3",
  },
}

export type PresignOutcome =
  | {
      ok: true
      presignedUrl: string
      finalUrl: string
      key: string
      expiresIn: number
    }
  | { ok: false; status: number; error: string }

const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9.-]/g, "_")

export async function presignUpload(input: {
  kind: UploadKind
  /** Null only for a platform (DEVELOPER) video with no school. */
  schoolId: string | null
  filename: unknown
  contentType: unknown
  size: unknown
  /** Optional sub-folder (fee assignment id, user id…). */
  scope?: string | null
}): Promise<PresignOutcome> {
  const spec = UPLOAD_KINDS[input.kind]
  const { filename, contentType, size } = input

  if (
    typeof filename !== "string" ||
    !filename ||
    typeof contentType !== "string" ||
    !contentType ||
    typeof size !== "number" ||
    !size
  ) {
    return {
      ok: false,
      status: 400,
      error: "Missing required fields: filename, contentType, size",
    }
  }
  if (input.kind !== "video" && !input.schoolId) {
    return { ok: false, status: 400, error: "School context required" }
  }
  if (!spec.types.includes(contentType)) {
    return {
      ok: false,
      status: 400,
      error: `Invalid content type: ${contentType}`,
    }
  }
  if (size < 0 || size > spec.maxBytes) {
    return {
      ok: false,
      status: 400,
      error:
        input.kind === "payment_proof"
          ? `File exceeds the ${spec.sizeLabel} limit`
          : `File exceeds maximum size of ${spec.sizeLabel}`,
    }
  }

  // Storage quota pre-check — refuse before any bytes move, instead of
  // letting the upload finish and failing at submit time.
  if (input.kind === "video" && input.schoolId) {
    const quota = await checkSchoolVideoQuota(input.schoolId, size)
    if (!quota.allowed) {
      return {
        ok: false,
        status: 413,
        error: "Storage quota exceeded for this school",
      }
    }
  }

  const client = getS3Client()
  if (!client) {
    return {
      ok: false,
      status: 500,
      error:
        input.kind === "video"
          ? "S3 not configured for direct uploads"
          : "S3 not configured",
    }
  }

  const scope = (input.scope ?? "").replace(/[^a-zA-Z0-9-]/g, "")
  const name = spec.nameMax
    ? sanitize(filename).slice(-spec.nameMax)
    : sanitize(filename)
  const key = `${spec.prefix(input.schoolId, scope)}/${Date.now()}_${name}`
  const bucket = process.env.AWS_S3_BUCKET!
  const region = process.env.AWS_REGION || "us-east-1"

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
  })

  // @ts-expect-error - AWS SDK @smithy/types version mismatch between packages
  const presignedUrl = await getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
  })

  const s3Url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`
  const cdn = process.env.CLOUDFRONT_DOMAIN
  const finalUrl =
    spec.finalUrl === "cdn" && cdn ? `https://${cdn}/${key}` : s3Url

  return {
    ok: true,
    presignedUrl,
    finalUrl,
    key,
    expiresIn: PRESIGNED_URL_EXPIRY,
  }
}
