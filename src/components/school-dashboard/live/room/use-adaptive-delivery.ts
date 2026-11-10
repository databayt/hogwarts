"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
import { useRoomContext } from "@livekit/components-react"
import {
  ConnectionQuality,
  ConnectionState,
  RoomEvent,
  Track,
  VideoQuality,
  type Participant,
  type RemoteTrackPublication,
} from "livekit-client"

import {
  initialAdaptiveState,
  nextAdaptiveState,
  type AdaptiveState,
  type DeliveryTier,
  type QualitySample,
} from "./adaptive-delivery"

/** How often the local connection is sampled into the ladder. With the
 *  ladder's own thresholds, a steadily poor link steps down in 8–12 seconds. */
export const QUALITY_SAMPLE_MS = 4_000

const TIER_QUALITY: Record<Exclude<DeliveryTier, "audio">, VideoQuality> = {
  high: VideoQuality.HIGH,
  medium: VideoQuality.MEDIUM,
  low: VideoQuality.LOW,
}

function sampleOf(q: ConnectionQuality): QualitySample {
  switch (q) {
    case ConnectionQuality.Excellent:
      return "excellent"
    case ConnectionQuality.Good:
      return "good"
    case ConnectionQuality.Poor:
      return "poor"
    case ConnectionQuality.Lost:
      return "lost"
    default:
      return "unknown"
  }
}

/**
 * Applies a delivery tier to every remote CAMERA publication: pick the
 * simulcast layer, or unsubscribe from camera video entirely for the
 * audio + slides tier. Screen shares are never touched — the slides are the
 * one thing a struggling connection must keep.
 *
 * Requires `adaptiveStream: false` on the room: with it on, the SDK ignores
 * `setVideoQuality`/`setEnabled` and this whole ladder would be a no-op.
 */
function applyTier(tier: DeliveryTier, participants: Iterable<Participant>) {
  for (const p of participants) {
    for (const pub of p.videoTrackPublications.values()) {
      if (pub.source !== Track.Source.Camera) continue
      const remote = pub as RemoteTrackPublication
      if (typeof remote.setEnabled !== "function") continue
      if (tier === "audio") {
        remote.setEnabled(false)
      } else {
        remote.setEnabled(true)
        remote.setVideoQuality(TIER_QUALITY[tier])
      }
    }
  }
}

export interface AdaptiveDelivery {
  /** The tier in effect (manual choice wins over the automatic ladder). */
  tier: DeliveryTier
  /** Latest sample of the local connection. */
  quality: QualitySample
  /** `null` = automatic. */
  manual: DeliveryTier | null
  setManual: (tier: DeliveryTier | null) => void
}

export function useAdaptiveDelivery(): AdaptiveDelivery {
  const room = useRoomContext()
  const stateRef = useRef<AdaptiveState>(initialAdaptiveState("high"))
  const [tier, setTier] = useState<DeliveryTier>("high")
  const [quality, setQuality] = useState<QualitySample>("unknown")
  const [manual, setManualState] = useState<DeliveryTier | null>(null)
  const manualRef = useRef<DeliveryTier | null>(null)

  const effective = manual ?? tier

  // Re-apply whenever the effective tier changes or a new camera shows up.
  useEffect(() => {
    applyTier(effective, room.remoteParticipants.values())
    const onTrack = () =>
      applyTier(
        manualRef.current ?? stateRef.current.tier,
        room.remoteParticipants.values()
      )
    room.on(RoomEvent.TrackPublished, onTrack)
    room.on(RoomEvent.TrackSubscribed, onTrack)
    room.on(RoomEvent.ParticipantConnected, onTrack)
    return () => {
      room.off(RoomEvent.TrackPublished, onTrack)
      room.off(RoomEvent.TrackSubscribed, onTrack)
      room.off(RoomEvent.ParticipantConnected, onTrack)
    }
  }, [room, effective])

  // Feed the ladder with the LOCAL participant's quality — that is the
  // connection that decides what this viewer can receive.
  //
  // On a CLOCK as well as on the SDK's event. `ConnectionQualityChanged` fires
  // only when the value changes, and the ladder wants two poor samples eight
  // seconds apart before it steps down and twenty good seconds before it
  // steps back up. A link that is steadily poor therefore produced exactly
  // one sample and never stepped down — the case the ladder exists for — and
  // one that recovered never stepped back up.
  useEffect(() => {
    const feed = (q: ConnectionQuality) => {
      const sample = sampleOf(q)
      setQuality(sample)
      const next = nextAdaptiveState(stateRef.current, sample, Date.now())
      const changed = next.tier !== stateRef.current.tier
      stateRef.current = next
      if (changed) setTier(next.tier)
    }
    const onQuality = (q: ConnectionQuality, participant: Participant) => {
      if (participant.identity !== room.localParticipant.identity) return
      feed(q)
    }
    room.on(RoomEvent.ConnectionQualityChanged, onQuality)
    const timer = setInterval(() => {
      // Only while the call is up: a sample taken mid-reconnect reads as
      // "unknown", which the ladder ignores anyway, but there is nothing to
      // learn from it either.
      if (room.state === ConnectionState.Connected) {
        feed(room.localParticipant.connectionQuality)
      }
    }, QUALITY_SAMPLE_MS)
    return () => {
      room.off(RoomEvent.ConnectionQualityChanged, onQuality)
      clearInterval(timer)
    }
  }, [room])

  const setManual = useCallback((t: DeliveryTier | null) => {
    manualRef.current = t
    setManualState(t)
    if (t === null) {
      // Back to automatic from wherever the ladder is now.
      stateRef.current = initialAdaptiveState(stateRef.current.tier)
    }
  }, [])

  return { tier: effective, quality, manual, setManual }
}
