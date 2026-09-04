// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Minimal shared S3 helpers for the direct-upload pipeline.
 *
 * Kept deliberately tiny: a lazy singleton client plus the two object-level
 * operations the stream upload flow needs — HEAD (authoritative byte size for
 * quota accounting) and DELETE (abandoned-upload cleanup). URL/CDN concerns
 * live in `@/lib/cloudfront`.
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Re-exported so `@/lib/s3` stays the one import for server-side storage work.
export { extractStorageKey, isOwnStorageUrl } from "@/lib/storage-key"

/**
 * Lifetime of a minted read URL.
 *
 * Long enough that a viewer can pause mid-lesson and come back without the
 * source dying, short enough that a URL lifted out of devtools stops working
 * the same afternoon. The player re-fetches its source on error, so an expiry
 * mid-playback self-heals rather than stranding the viewer.
 */
export const SIGNED_READ_TTL_SECONDS = 2 * 60 * 60

let s3Client: S3Client | null = null

export function getS3Client(): S3Client | null {
  if (
    !process.env.AWS_ACCESS_KEY_ID ||
    !process.env.AWS_SECRET_ACCESS_KEY ||
    !process.env.AWS_S3_BUCKET
  ) {
    return null
  }

  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })
  }
  return s3Client
}

/**
 * Authoritative object size in bytes via HEAD, or null when S3 is not
 * configured, the object doesn't exist, or the call fails. Callers fall back
 * to their client-supplied size on null — never throw over quota accounting.
 */
export async function getObjectSize(key: string): Promise<number | null> {
  const client = getS3Client()
  if (!client || !key) return null

  try {
    const head = await client.send(
      new HeadObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key })
    )
    return typeof head.ContentLength === "number" ? head.ContentLength : null
  } catch {
    return null
  }
}

/**
 * Best-effort object delete. Returns false (never throws) when S3 is not
 * configured or the delete fails — cleanup must never break a user flow.
 */
export async function deleteObject(key: string): Promise<boolean> {
  const client = getS3Client()
  if (!client || !key) return false

  try {
    await client.send(
      new DeleteObjectCommand({ Bucket: process.env.AWS_S3_BUCKET!, Key: key })
    )
    return true
  } catch (error) {
    console.error("S3 deleteObject failed:", error)
    return false
  }
}

/**
 * Mint a short-lived presigned GET for an object in the upload bucket.
 *
 * This is what replaces handing out permanent public URLs: the object stays
 * unreadable to anonymous callers (see the bucket policy), and every playable
 * link is minted per viewer, per request, after authorization.
 *
 * Returns null when S3 is unconfigured or signing fails — callers must treat
 * null as "no playable source" rather than falling back to an unsigned URL.
 */
export async function getSignedReadUrl(
  key: string,
  expiresIn: number = SIGNED_READ_TTL_SECONDS,
  options: {
    downloadFilename?: string
    contentType?: string
    /** Serve for display, never as a save-as — school materials are viewed, not downloaded. */
    inline?: boolean
  } = {}
): Promise<string | null> {
  const client = getS3Client()
  if (!client || !key) return null

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: key,
      // Force a save-as name for attachment downloads; omitted for video so the
      // browser streams inline.
      ...(options.inline
        ? { ResponseContentDisposition: "inline" }
        : options.downloadFilename
          ? {
              ResponseContentDisposition: `attachment; filename="${options.downloadFilename.replace(/"/g, "")}"`,
            }
          : {}),
      ...(options.contentType
        ? { ResponseContentType: options.contentType }
        : {}),
    })

    // @ts-expect-error - AWS SDK @smithy/types version mismatch between packages
    return await getSignedUrl(client, command, { expiresIn })
  } catch (error) {
    console.error("S3 getSignedReadUrl failed:", error)
    return null
  }
}

/**
 * Copy an object between buckets (server-side, no download). Used to publish
 * a live-class recording — written by egress under `schools/…` in
 * `LIVEKIT_RECORDING_BUCKET`, with its own retention — as a lumos video under
 * `stream/<schoolId>/video/` in the app's own `AWS_S3_BUCKET`, which has
 * none. The two buckets are DIFFERENT env vars and are not guaranteed to
 * match (a self-hosted SFU commonly writes to its own recordings bucket);
 * the destination is always the app bucket, so only the source is a
 * parameter. Returns false when the client is unconfigured or the copy
 * fails; the caller decides whether that is fatal.
 */
export async function copyObject(
  sourceBucket: string,
  sourceKey: string,
  destinationKey: string,
  contentType?: string
): Promise<boolean> {
  const client = getS3Client()
  const destinationBucket = process.env.AWS_S3_BUCKET
  if (!client || !destinationBucket || !sourceBucket) return false
  try {
    const { CopyObjectCommand } = await import("@aws-sdk/client-s3")
    await client.send(
      new CopyObjectCommand({
        Bucket: destinationBucket,
        CopySource: `${sourceBucket}/${encodeURI(sourceKey)}`,
        Key: destinationKey,
        ...(contentType
          ? { ContentType: contentType, MetadataDirective: "REPLACE" }
          : {}),
      })
    )
    return true
  } catch (err) {
    console.error("[s3] copyObject failed", {
      sourceBucket,
      sourceKey,
      destinationKey,
      err,
    })
    return false
  }
}
