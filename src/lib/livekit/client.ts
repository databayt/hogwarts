// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { EgressClient, RoomServiceClient } from "livekit-server-sdk"

// Lazy singletons. Throws only when called — env vars may be missing in
// dev environments without a SFU. Lib callers can catch and surface
// LIVE_CLASS_PROVIDER_UNAVAILABLE.

let roomServiceClient: RoomServiceClient | null = null
let egressClient: EgressClient | null = null

export type LiveKitConfig = {
  host: string
  apiKey: string
  apiSecret: string
  wsUrl: string
  recordingBucket: string
  recordingRegion: string
}

export function getLiveKitConfig(): LiveKitConfig {
  const host = process.env.LIVEKIT_HOST
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl = process.env.LIVEKIT_WS_URL
  const recordingBucket = process.env.LIVEKIT_RECORDING_BUCKET
  const recordingRegion = process.env.LIVEKIT_RECORDING_REGION ?? "me-central-1"

  if (!host || !apiKey || !apiSecret || !wsUrl) {
    throw new Error(
      "LiveKit not configured: set LIVEKIT_HOST, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, LIVEKIT_WS_URL"
    )
  }
  if (!recordingBucket) {
    throw new Error(
      "LiveKit recording not configured: set LIVEKIT_RECORDING_BUCKET"
    )
  }
  return { host, apiKey, apiSecret, wsUrl, recordingBucket, recordingRegion }
}

export function isLiveKitConfigured(): boolean {
  try {
    getLiveKitConfig()
    return true
  } catch {
    return false
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
