// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// jose's HS256 path checks `payload instanceof Uint8Array`, which fails
// under jsdom because TextEncoder lives in the jsdom realm and produces
// a Uint8Array whose prototype isn't Node's global one. Forcing this
// suite to the node environment sidesteps the realm mismatch.

import type { ConferenceParticipantRole } from "@prisma/client"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { roomNameFor } from "../room-naming"
import { issueAccessToken } from "../token"

/**
 * Decode a JWT without verifying the signature. We only inspect the
 * payload to check claim shape — verification is done by LiveKit itself.
 */
function decodeJwtPayload(jwt: string): Record<string, unknown> {
  const [, payload] = jwt.split(".")
  if (!payload) throw new Error("invalid jwt")
  // Base64url → base64
  const b64 = payload.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
  return JSON.parse(Buffer.from(b64 + pad, "base64").toString("utf8"))
}

const SCHOOL_ID = "school-aldar-1"
const SESSION_ID = "lcs-abc123"
const USER_ID = "user-42"
const ROOM_NAME = roomNameFor(SCHOOL_ID, SESSION_ID)

const ENV_KEYS = [
  "LIVEKIT_HOST",
  "LIVEKIT_WS_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "LIVEKIT_RECORDING_BUCKET",
] as const

describe("issueAccessToken", () => {
  const saved: Record<string, string | undefined> = {}

  beforeEach(() => {
    for (const k of ENV_KEYS) saved[k] = process.env[k]
    process.env.LIVEKIT_HOST = "https://livekit.test"
    process.env.LIVEKIT_WS_URL = "wss://livekit.test"
    process.env.LIVEKIT_API_KEY = "test-key-id"
    process.env.LIVEKIT_API_SECRET = "test-secret-must-be-long-enough-for-hs256"
    process.env.LIVEKIT_RECORDING_BUCKET = "test-bucket"
  })

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k]
      else process.env[k] = saved[k]
    }
  })

  async function issue(role: ConferenceParticipantRole, ttlSec?: number) {
    return issueAccessToken({
      schoolId: SCHOOL_ID,
      sessionId: SESSION_ID,
      userId: USER_ID,
      role,
      roomName: ROOM_NAME,
      ttlSec,
      lang: "ar",
    })
  }

  it("returns a parseable JWT with iss = apiKey and sub = identity", async () => {
    const token = await issue("HOST")
    const payload = decodeJwtPayload(token) as {
      iss: string
      sub: string
      video: Record<string, unknown>
      metadata?: string
      exp?: number
      nbf?: number
    }
    expect(payload.iss).toBe("test-key-id")
    expect(payload.sub).toBe(USER_ID)
    expect(payload.video).toBeDefined()
  })

  it("HOST grants include roomAdmin + roomCreate + roomRecord + canPublish", async () => {
    const token = await issue("HOST")
    const { video } = decodeJwtPayload(token) as {
      video: {
        room: string
        roomJoin: boolean
        canPublish: boolean
        canSubscribe: boolean
        canPublishData: boolean
        roomAdmin: boolean
        roomCreate: boolean
        roomRecord: boolean
      }
    }
    expect(video.room).toBe(ROOM_NAME)
    expect(video.roomJoin).toBe(true)
    expect(video.canPublish).toBe(true)
    expect(video.canSubscribe).toBe(true)
    expect(video.canPublishData).toBe(true)
    expect(video.roomAdmin).toBe(true)
    expect(video.roomCreate).toBe(true)
    expect(video.roomRecord).toBe(true)
  })

  it("CO_HOST grants include publish + subscribe but not roomAdmin", async () => {
    const token = await issue("CO_HOST")
    const { video } = decodeJwtPayload(token) as {
      video: { canPublish: boolean; canSubscribe: boolean; roomAdmin?: boolean }
    }
    expect(video.canPublish).toBe(true)
    expect(video.canSubscribe).toBe(true)
    expect(video.roomAdmin).toBeFalsy()
  })

  it("PARTICIPANT (student) grants publish + subscribe but not admin", async () => {
    const token = await issue("PARTICIPANT")
    const { video } = decodeJwtPayload(token) as {
      video: { canPublish: boolean; canSubscribe: boolean; roomAdmin?: boolean }
    }
    expect(video.canPublish).toBe(true)
    expect(video.canSubscribe).toBe(true)
    expect(video.roomAdmin).toBeFalsy()
  })

  it("OBSERVER (guardian) is subscribe-only, no publish", async () => {
    const token = await issue("OBSERVER")
    const { video } = decodeJwtPayload(token) as {
      video: {
        canSubscribe: boolean
        canPublish?: boolean
        canPublishData?: boolean
        roomAdmin?: boolean
      }
    }
    expect(video.canSubscribe).toBe(true)
    expect(video.canPublish).toBeFalsy()
    expect(video.canPublishData).toBeFalsy()
    expect(video.roomAdmin).toBeFalsy()
  })

  it("Token expires in ~ttlSec seconds (default 300)", async () => {
    const token = await issue("PARTICIPANT")
    const payload = decodeJwtPayload(token) as { exp: number; nbf?: number }
    const expectedExp = Math.floor(Date.now() / 1000) + 300
    // Allow 5s skew for test execution time.
    expect(payload.exp).toBeGreaterThan(expectedExp - 5)
    expect(payload.exp).toBeLessThan(expectedExp + 5)
  })

  it("Custom ttl honored", async () => {
    const token = await issue("PARTICIPANT", 60)
    const payload = decodeJwtPayload(token) as { exp: number }
    const expectedExp = Math.floor(Date.now() / 1000) + 60
    expect(payload.exp).toBeGreaterThan(expectedExp - 5)
    expect(payload.exp).toBeLessThan(expectedExp + 5)
  })

  it("Metadata JSON encodes schoolId, sessionId, role, lang", async () => {
    const token = await issue("PARTICIPANT")
    const payload = decodeJwtPayload(token) as { metadata: string }
    const meta = JSON.parse(payload.metadata)
    expect(meta).toEqual({
      schoolId: SCHOOL_ID,
      sessionId: SESSION_ID,
      role: "PARTICIPANT",
      lang: "ar",
    })
  })

  it("Room name is scoped to the school — issuing a token for a different roomName uses that exact value", async () => {
    const otherRoom = roomNameFor("school-other", SESSION_ID)
    const token = await issueAccessToken({
      schoolId: "school-other",
      sessionId: SESSION_ID,
      userId: USER_ID,
      role: "HOST",
      roomName: otherRoom,
    })
    const { video } = decodeJwtPayload(token) as { video: { room: string } }
    expect(video.room).toBe(otherRoom)
    expect(video.room).not.toBe(ROOM_NAME)
  })
})
