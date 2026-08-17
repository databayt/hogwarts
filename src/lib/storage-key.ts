// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Storage-key parsing, deliberately free of any AWS SDK import.
 *
 * `@/lib/s3` pulls the S3 client at module scope, so anything that only
 * needs to *recognise* one of our object URLs imports this instead and
 * keeps the SDK out of the bundle.
 */

/**
 * Storage key for an object in the upload bucket, or null when the URL points
 * somewhere we don't own (YouTube/Vimeo, another host, a bare path).
 *
 * Accepts both URL shapes the bucket has ever been written as:
 * - virtual-hosted S3 (`https://<bucket>.s3.<region>.amazonaws.com/<key>`)
 * - CloudFront (`https://<domain>/<key>`) for the distribution that fronts it
 *
 * Prefer a stored `storageKey` when the row has one; this is the fallback for
 * rows written before that column existed.
 */
export function extractStorageKey(url: string): string | null {
  if (!url) return null

  // Already a bare key (no scheme) — trust it as-is.
  if (!/^https?:\/\//i.test(url)) {
    return url.replace(/^\/+/, "") || null
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  const key = decodeURIComponent(parsed.pathname).replace(/^\/+/, "")
  if (!key) return null

  const bucket = process.env.AWS_S3_BUCKET
  const host = parsed.hostname.toLowerCase()

  // Virtual-hosted or path-style S3 for OUR bucket only.
  if (bucket) {
    if (host.startsWith(`${bucket.toLowerCase()}.s3.`)) return key
    if (/^s3[.-]/.test(host) && key.startsWith(`${bucket}/`)) {
      return key.slice(bucket.length + 1) || null
    }
  }

  // CloudFront domain that fronts the upload bucket, when one is configured.
  const cfOrigin = process.env.CLOUDFRONT_ORIGIN_BUCKET
  const cfDomain = process.env.CLOUDFRONT_DOMAIN
  if (
    cfDomain &&
    cfOrigin &&
    cfOrigin === bucket &&
    host === cfDomain.toLowerCase()
  ) {
    return key
  }

  return null
}

/**
 * True when the URL points at an object in our own upload bucket — i.e. one
 * we can sign, and therefore one that must not be handed out raw.
 */
export function isOwnStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  if (!/^https?:\/\//i.test(url)) return false
  return extractStorageKey(url) !== null
}
