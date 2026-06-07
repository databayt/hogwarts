// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type { ConferenceRecording } from "@prisma/client"

let s3: S3Client | null = null

function getS3Client(region: string): S3Client {
  if (s3 && s3.config.region === region) return s3
  s3 = new S3Client({
    region,
    credentials: process.env.AWS_ACCESS_KEY_ID
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
        }
      : undefined,
  })
  return s3
}

/**
 * Generate a short-lived signed URL to stream a recording.
 * Never bake S3 URLs into the DB — generate per-request.
 */
export async function getRecordingPlaybackUrl(
  recording: Pick<
    ConferenceRecording,
    "s3Bucket" | "s3Key" | "s3Region" | "mimeType"
  >,
  ttlSec = 300
): Promise<string> {
  const client = getS3Client(recording.s3Region)
  const command = new GetObjectCommand({
    Bucket: recording.s3Bucket,
    Key: recording.s3Key,
    ResponseContentType: recording.mimeType,
  })
  // S3Client satisfies the structural client constraint of getSignedUrl
  // but the version of @smithy/types pinned for getSignedUrl mismatches the
  // S3Client's declared client type. Safe to cast — runtime is identical.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getSignedUrl(client as any, command as any, { expiresIn: ttlSec })
}

/**
 * Delete a recording object from S3. Used by the retention cron.
 * Returns true if deleted, false if the object was already gone.
 */
export async function deleteRecordingObject(
  recording: Pick<ConferenceRecording, "s3Bucket" | "s3Key" | "s3Region">
): Promise<boolean> {
  const { DeleteObjectCommand } = await import("@aws-sdk/client-s3")
  const client = getS3Client(recording.s3Region)
  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: recording.s3Bucket,
        Key: recording.s3Key,
      })
    )
    return true
  } catch {
    return false
  }
}
