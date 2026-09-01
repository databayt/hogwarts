// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import type { ConferenceParticipantRole } from "@prisma/client"
import { AccessToken, TrackSource, type VideoGrant } from "livekit-server-sdk"

import { getLiveKitConfig } from "./client"

export interface IssueTokenInput {
  /** Tenant scoping — also encoded in roomName. */
  schoolId: string
  /** Conference.id */
  sessionId: string
  /** App user id used as the LiveKit identity. Must be unique per room. */
  userId: string
  /** Participant role drives publish/subscribe/admin grants. */
  role: ConferenceParticipantRole
  /** roomName from `roomNameFor(schoolId, sessionId)`. */
  roomName: string
  /** Display name shown in the room (e.g., "Sarah Khan"). Optional. */
  displayName?: string
  /** Content language so the client UI can render in the right locale. */
  lang?: string
  /** PARTICIPANT only: may publish a screen share (school room-tools setting). */
  allowScreenShare?: boolean
  /** Token TTL in seconds. Default 300 (5 min). Refresh before expiry. */
  ttlSec?: number
}

/**
 * Map ConferenceParticipantRole → LiveKit VideoGrant.
 *
 * HOST     — full control: publish, subscribe, mute others, end room.
 * CO_HOST  — co-teacher / TA: publish + subscribe.
 * PARTICIPANT — student: publish (so they can ask questions) + subscribe.
 * OBSERVER — parent: subscribe-only.
 */
function grantsForRole(
  role: ConferenceParticipantRole,
  roomName: string,
  allowScreenShare = true
): VideoGrant {
  const base: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
  }
  switch (role) {
    // `canUpdateOwnMetadata` is what lets a participant raise a hand: the
    // hand rides on participant attributes, which the SFU replays to late
    // joiners. Observers cannot raise hands and cannot publish data.
    case "HOST":
      return {
        ...base,
        canPublish: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
        roomAdmin: true,
        roomCreate: true,
        roomRecord: true,
      }
    case "CO_HOST":
      return {
        ...base,
        canPublish: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
      }
    case "PARTICIPANT":
      return {
        ...base,
        canPublish: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
        // Server-side, not only a hidden button: a student without the
        // school's screen-share tool cannot publish a screen track at all.
        ...(allowScreenShare
          ? {}
          : {
              canPublishSources: [TrackSource.CAMERA, TrackSource.MICROPHONE],
            }),
      }
    case "OBSERVER":
      return {
        ...base,
        canPublish: false,
        canPublishData: false,
      }
  }
}

/**
 * Issue a short-lived JWT for a participant to join a LiveKit room.
 *
 * Token claims include identity, room grants, name, and JSON metadata
 * with `{ schoolId, sessionId, role, lang }` for client-side use.
 */
export async function issueAccessToken(
  input: IssueTokenInput
): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitConfig()
  const ttlSec = input.ttlSec ?? 300

  const token = new AccessToken(apiKey, apiSecret, {
    identity: input.userId,
    name: input.displayName,
    ttl: ttlSec,
    metadata: JSON.stringify({
      schoolId: input.schoolId,
      sessionId: input.sessionId,
      role: input.role,
      lang: input.lang ?? "ar",
    }),
    // Attributes are readable by every participant (metadata is a string the
    // client has to parse); the room trusts host-only messages by this.
    attributes: { role: input.role },
  })

  token.addGrant(
    grantsForRole(input.role, input.roomName, input.allowScreenShare ?? true)
  )
  return await token.toJwt()
}
