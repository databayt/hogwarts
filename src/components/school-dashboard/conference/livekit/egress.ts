// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { randomUUID } from "node:crypto"
import { EncodedFileType, type EncodedFileOutput } from "livekit-server-sdk"

import { getEgressClient, getLiveKitConfig } from "./client"

export interface StartRecordingInput {
  roomName: string
  schoolId: string
  sessionId: string
  /** "speaker" (default) or "grid" — LiveKit composite layout. */
  layout?: "speaker" | "grid"
}

export interface StartRecordingResult {
  egressId: string
  s3Bucket: string
  s3Key: string
  s3Region: string
}

/**
 * Start a LiveKit composite (room) recording. Pushes a single MP4 to
 * S3 me-central-1 at:
 *   schools/{schoolId}/live-class/{sessionId}/{timestamp}-{rand}.mp4
 *
 * The egressId isn't known until the egress call returns, so the key uses a
 * timestamp + random suffix instead — this guarantees a unique object even if
 * two egress jobs start for the same session within the same millisecond.
 *
 * Authentication: the SFU needs IAM credentials with `s3:PutObject` on the
 * recording bucket — these are configured on the SFU host, NOT in Node
 * env. We pass empty creds so LiveKit uses its instance role.
 */
export async function startCompositeEgress(
  input: StartRecordingInput
): Promise<StartRecordingResult> {
  const cfg = getLiveKitConfig()
  const egress = getEgressClient()

  const timestamp = Date.now()
  const filepath = `schools/${input.schoolId}/live-class/${input.sessionId}/${timestamp}-${randomUUID().slice(0, 8)}.mp4`

  // LiveKit Egress S3 output. AWS creds left blank — SFU uses host IAM role.
  const fileOutput: EncodedFileOutput = {
    fileType: EncodedFileType.MP4,
    filepath,
    output: {
      case: "s3",
      value: {
        accessKey: process.env.LIVEKIT_S3_ACCESS_KEY ?? "",
        secret: process.env.LIVEKIT_S3_SECRET ?? "",
        region: cfg.recordingRegion,
        bucket: cfg.recordingBucket,
      },
    },
  } as unknown as EncodedFileOutput

  const info = await egress.startRoomCompositeEgress(
    input.roomName,
    fileOutput,
    { layout: input.layout ?? "speaker" }
  )

  return {
    egressId: info.egressId,
    s3Bucket: cfg.recordingBucket,
    s3Key: filepath,
    s3Region: cfg.recordingRegion,
  }
}

export async function stopEgress(egressId: string): Promise<void> {
  const egress = getEgressClient()
  await egress.stopEgress(egressId)
}
