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

export type RoomJoinTicket = {
  token: string
  wsUrl: string
  roomName: string
  identity: string
  role: ConferenceParticipantRole
  expiresAt: string // ISO
}
