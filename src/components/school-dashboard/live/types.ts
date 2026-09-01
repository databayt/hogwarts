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

export type ConferenceWithRefs = Conference & {
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
