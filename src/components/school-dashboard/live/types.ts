// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  Conference,
  ConferenceParticipant,
  ConferenceParticipantRole,
  ConferenceRecording,
  ConferenceRecordingStatus,
  ConferenceStatus,
} from "@prisma/client"

export type {
  ConferenceParticipant,
  ConferenceParticipantRole,
  ConferenceRecording,
  ConferenceRecordingStatus,
  Conference,
  ConferenceStatus,
}

export type LiveWithRefs = Conference & {
  teacher: { id: string; firstName: string; lastName: string } | null
  section: { id: string; name: string } | null
  subject: { id: string; name: string } | null
  _count?: { participants: number; recordings: number }
}

export type RoomTools = {
  chat: boolean
  hands: boolean
  polls: boolean
  whiteboard: boolean
  /** Students may share their screen. Enforced in the token grant, not only the UI. */
  studentShare: boolean
}

export type RoomConfig = {
  /** Students enter with mic + camera off. */
  joinMuted: boolean
  tools: RoomTools
  /** Shown on join when the class is recorded; null = the app's default sentence. */
  consentNote: string | null
  recording: boolean
}

export type RoomJoinTicket = {
  token: string
  wsUrl: string
  roomName: string
  identity: string
  role: ConferenceParticipantRole
  /** The teacher's identity — the data-channel address for votes and hand state. */
  hostIdentity: string | null
  /** School + session configuration the room UI honours. */
  roomConfig: RoomConfig
  expiresAt: string // ISO
}

/**
 * ROOM metadata JSON shape published by the server (`livekit/rooms.ts
 * addRoomHost`, called from `actions/join-core.ts` whenever a HOST or
 * CO_HOST joins) — the authoritative set of host identities for a room.
 *
 * Room metadata is written only by `addRoomHost`, through LiveKit's
 * `RoomServiceClient` — authenticated with the API key/secret, a credential
 * no browser-held token carries — never through a participant's own
 * `canUpdateOwnMetadata` video grant. That distinction is deliberate:
 * `canUpdateOwnMetadata` is also what lets a PARTICIPANT raise a hand (it
 * rides on participant `attributes`), so a participant's own client can call
 * `localParticipant.setAttributes({ role: "HOST" })` at will — the SFU only
 * checks that the caller HAS the grant, not which attribute key it touches.
 * Host trust must therefore come from here, never from
 * `participant.attributes.role`.
 */
export type RoomHostsMetadata = {
  hosts: string[]
}

/**
 * Safe-parse `Room.metadata` (server `Room.metadata` or the client SDK's
 * `room.metadata`) into the host identity list. Malformed, empty, or foreign
 * metadata parses to an empty list rather than throwing — a mid-transition
 * read is a "no known hosts yet" state, not an error.
 */
export function parseRoomHostsMetadata(
  raw: string | null | undefined
): string[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    const hosts =
      parsed && typeof parsed === "object"
        ? (parsed as { hosts?: unknown }).hosts
        : undefined
    if (!Array.isArray(hosts)) return []
    return hosts.filter((id): id is string => typeof id === "string")
  } catch {
    return []
  }
}
