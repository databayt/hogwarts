// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Normalize dead CDN upload URLs back to the raw S3 upload bucket.
 *
 * A previous version of the S3 provider rewrote every upload URL to the
 * `cdn.databayt.org` CloudFront domain — but that distribution serves the
 * curated `databayt-cdn` bucket, NOT the `hogwarts-databayt` upload bucket, so
 * those URLs 403 for every user-uploaded asset (avatars, apply photos, apply
 * documents). The write path is now fixed to store raw S3 URLs, but rows
 * created before that fix still hold broken `cdn.databayt.org` links.
 *
 * This helper rewrites ONLY upload-bucket assets (identified by their upload
 * folder segment) from the CDN host back to the S3 host. Curated CDN assets
 * (`/anthropic/…`, `/illustrations/…`, catalog covers, …) never match an
 * upload folder, so they pass through untouched.
 *
 * Pure string logic — safe in both server and client components.
 */

// The CloudFront domain that mistakenly fronted upload-bucket assets.
const CDN_HOST = process.env.NEXT_PUBLIC_CDN_DOMAIN || "cdn.databayt.org"

// The real upload bucket host. Derived from env on the server; falls back to
// the known constant on the client (also hard-coded in next.config image
// remotePatterns) since AWS_S3_BUCKET is not a public env var.
const UPLOAD_S3_HOST =
  typeof process !== "undefined" && process.env.AWS_S3_BUCKET
    ? `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`
    : "hogwarts-databayt.s3.us-east-1.amazonaws.com"

// Key prefixes that only ever live in the upload bucket.
const UPLOAD_FOLDER_RE =
  /\/(apply-photos|apply-documents|apply-signatures|profile-photos|avatars|uploads|documents)\//i

export function normalizeUploadUrl<T extends string | null | undefined>(
  url: T
): T {
  if (!url) return url
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== CDN_HOST) return url
    if (!UPLOAD_FOLDER_RE.test(parsed.pathname)) return url
    parsed.hostname = UPLOAD_S3_HOST
    return parsed.toString() as T
  } catch {
    return url
  }
}
