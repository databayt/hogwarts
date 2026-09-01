// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Pure ICE-path classification for the LiveKit network diagnostic — split out
// from network-test.tsx so it can be unit-tested without the client/SDK.

export type ProtocolClass =
  | "direct-udp"
  | "turn-udp"
  | "turn-tcp-443"
  | "unknown"

/** Loose shape of the RTCStats rows we care about (fields are spec-optional). */
interface IceStat {
  type?: string
  id?: string
  selectedCandidatePairId?: string
  selected?: boolean
  nominated?: boolean
  state?: string
  localCandidateId?: string
  candidateType?: string
  relayProtocol?: string
  protocol?: string
  port?: number
}

/**
 * Classify the selected ICE candidate-pair into the transport path that the
 * Aldar Meeting-3 gate cares about: a direct UDP connection, a TURN relay over
 * UDP, or a TURN relay forced over TCP/443 (the UAE VoIP-throttle fallback).
 * Returns "unknown" when no candidate-pair can be resolved (e.g. no media was
 * negotiated). Pure — feed it `RTCPeerConnection.getStats()` output.
 */
export function classifyFromStats(report: RTCStatsReport): ProtocolClass {
  let selectedPairId = ""
  const pairs = new Map<string, IceStat>()
  const locals = new Map<string, IceStat>()

  report.forEach((value) => {
    const s = value as IceStat
    if (s.type === "transport") {
      if (s.selectedCandidatePairId) selectedPairId = s.selectedCandidatePairId
    } else if (s.type === "candidate-pair" && s.id) {
      pairs.set(s.id, s)
    } else if (s.type === "local-candidate" && s.id) {
      locals.set(s.id, s)
    }
  })

  // Prefer the transport's pointer; otherwise the nominated/selected/succeeded
  // pair (browsers differ on which signal they expose).
  let pair = selectedPairId ? pairs.get(selectedPairId) : undefined
  if (!pair) {
    for (const p of pairs.values()) {
      if (p.selected || p.nominated || p.state === "succeeded") {
        pair = p
        break
      }
    }
  }
  if (!pair?.localCandidateId) return "unknown"

  const local = locals.get(pair.localCandidateId)
  if (!local) return "unknown"

  if (local.candidateType === "relay") {
    if (
      local.relayProtocol === "tls" ||
      local.protocol === "tcp" ||
      local.port === 443
    ) {
      return "turn-tcp-443"
    }
    return "turn-udp"
  }
  return "direct-udp"
}
