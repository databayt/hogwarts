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
  HeadObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"

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
