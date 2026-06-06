// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  LiveClassParticipant,
  LiveClassParticipantRole,
  LiveClassRecording,
  LiveClassRecordingStatus,
  LiveClassSession,
  LiveClassStatus,
} from "@prisma/client"

export type {
  LiveClassParticipant,
  LiveClassParticipantRole,
  LiveClassRecording,
  LiveClassRecordingStatus,
  LiveClassSession,
  LiveClassStatus,
}

export type LiveClassSessionWithRefs = LiveClassSession & {
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
  role: LiveClassParticipantRole
  expiresAt: string // ISO
}
