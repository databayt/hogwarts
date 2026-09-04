// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { EgressClient, RoomServiceClient } from "livekit-server-sdk"

// Lazy singletons. Throws only when called — env vars may be missing in
// dev environments without a SFU. Lib callers can catch and surface
// LIVE_CLASS_PROVIDER_UNAVAILABLE.

let roomServiceClient: RoomServiceClient | null = null
let egressClient: EgressClient | null = null

/**
 * What it takes to hold a call: an SFU to talk to and a key to sign tokens with.
 *
 * Recording is deliberately NOT part of this. It used to be — `getLiveKitConfig`
 * threw without `LIVEKIT_RECORDING_BUCKET` and `isLiveKitConfigured()` catches,
 * so the whole video feature stayed dark until someone provisioned an S3 bucket.
 * That made an optional add-on a hard prerequisite for the core feature, which is
 * backwards: a school can hold live classes it never records, and every managed
 * SFU (LiveKit Cloud included) hands you a room long before you have storage.
 */
export type LiveKitConfig = {
  host: string
  apiKey: string
  apiSecret: string
  wsUrl: string
}

/** Where Egress writes recordings. Only the recording path needs this. */
export type LiveKitRecordingConfig = {
  recordingBucket: string
  recordingRegion: string
}

export function getLiveKitConfig(): LiveKitConfig {
  const host = process.env.LIVEKIT_HOST
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.LIVEKIT_WS_URL

  if (!host || !apiKey || !apiSecret || !wsUrl) {
    throw new Error(
      "LiveKit not configured: set LIVEKIT_HOST, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_WS_URL"
    )
  }
  return { host, apiKey, apiSecret, wsUrl }
}

export function getLiveKitRecordingConfig(): LiveKitRecordingConfig {
  const recordingBucket = process.env.LIVEKIT_RECORDING_BUCKET
  const recordingRegion = process.env.LIVEKIT_RECORDING_REGION ?? "me-central-1"

  if (!recordingBucket) {
    throw new Error(
      "LiveKit recording not configured: set LIVEKIT_RECORDING_BUCKET"
    )
  }
  return { recordingBucket, recordingRegion }
}

export function isLiveKitConfigured(): boolean {
  try {
    getLiveKitConfig()
    return true
  } catch {
    return false
  }
}

/**
 * True when Egress has somewhere to write. Guard every recording path on this
 * SEPARATELY from `isLiveKitConfigured()`: starting an egress that cannot upload
 * fails asynchronously on the SFU side, leaving a `ConferenceRecording` row stuck
 * `pending` forever — and nothing sweeps in-flight rows.
 */
export function isRecordingConfigured(): boolean {
  try {
    getLiveKitRecordingConfig()
    return true
  } catch {
    return false
  }
}

// Env vars that gate a usable SFU (must be present for isLiveKitConfigured).
const REQUIRED_ENV = [
  "LIVEKIT_HOST",
  "LIVEKIT_WS_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
] as const

// Where recordings land. Absent = rooms still work, recording is simply off.
const RECORDING_ENV = ["LIVEKIT_RECORDING_BUCKET"] as const

// S3 egress creds — optional even for recording (a self-hosted SFU can use its
// host IAM role instead). A managed SFU has no instance role, so absent here
// means egress will fail to upload. Surfaced as advisory.
const RECORDING_CREDS_ENV = [
  "LIVEKIT_S3_ACCESS_KEY",
  "LIVEKIT_S3_SECRET",
] as const

export interface LiveKitReadiness {
  /** True when every REQUIRED_ENV var is set (== isLiveKitConfigured). */
  configured: boolean
  /** Required vars still missing — the actionable provisioning gap. */
  missing: string[]
  /** True when recordings have a destination (== isRecordingConfigured). */
  recordingConfigured: boolean
  /** Recording destination vars still missing. */
  recordingMissing: string[]
  /** Optional S3 creds missing — egress uses the SFU host IAM role if absent. */
  recordingCredsMissing: string[]
  /**
   * True when `LIVEKIT_RECORDING_BUCKET` is set and differs from
   * `AWS_S3_BUCKET` — the recording→lesson bridge (`publishRecordingAsLessonVideo`)
   * copies cross-bucket in that case, which works (S3 CopyObject supports it)
   * but is worth surfacing: RUNBOOK.md's own self-host example sets the two
   * to different names. Purely advisory — never flips `configured` or
   * `recordingConfigured`.
   */
  recordingBucketMismatch: boolean
}

/**
 * Itemized readiness for ops/admin diagnostics. Unlike isLiveKitConfigured()
 * (a bare boolean), this names exactly which env vars are unset so the network-
 * test page can tell an admin what still needs provisioning. See RUNBOOK.md.
 *
 * Rooms and recording report separately on purpose — "rooms ready, recording
 * not configured" is a normal, shippable state, not a half-broken one.
 */
export function getLiveKitReadiness(): LiveKitReadiness {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k])
  const recordingMissing = RECORDING_ENV.filter((k) => !process.env[k])
  const recordingCredsMissing = RECORDING_CREDS_ENV.filter(
    (k) => !process.env[k]
  )
  const recordingBucket = process.env.LIVEKIT_RECORDING_BUCKET
  const appBucket = process.env.AWS_S3_BUCKET
  const recordingBucketMismatch = !!(
    recordingBucket &&
    appBucket &&
    recordingBucket !== appBucket
  )
  return {
    configured: missing.length === 0,
    missing,
    recordingConfigured: recordingMissing.length === 0,
    recordingMissing,
    recordingCredsMissing,
    recordingBucketMismatch,
  }
}

export function getRoomServiceClient(): RoomServiceClient {
  if (roomServiceClient) return roomServiceClient
  const { host, apiKey, apiSecret } = getLiveKitConfig()
  roomServiceClient = new RoomServiceClient(host, apiKey, apiSecret)
  return roomServiceClient
}

export function getEgressClient(): EgressClient {
  if (egressClient) return egressClient
  const { host, apiKey, apiSecret } = getLiveKitConfig()
  egressClient = new EgressClient(host, apiKey, apiSecret)
  return egressClient
}
