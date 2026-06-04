// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// handleWebhookEvent — verifies that each LiveKit event dispatches the
// right DB mutations + notifications, that s3Bucket/s3Region are
// populated from config on egress_started (the bug we patched), and that
// duplicate eventIds are dropped (idempotency).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { handleWebhookEvent } from "../webhook"

vi.mock("@/lib/db", () => ({
  db: {
    liveClassSession: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    liveClassParticipant: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    liveClassRecording: {
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    liveClassEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

const notifyClassStarted = vi.fn(async () => ({ created: 0 }))
const notifyClassRecordingReady = vi.fn(async () => ({ created: 0 }))

vi.mock(
  "@/components/school-dashboard/live-classes/actions/notifications",
  () => ({
    notifyClassStarted: (...a: unknown[]) => notifyClassStarted(...a),
    notifyClassRecordingReady: (...a: unknown[]) =>
      notifyClassRecordingReady(...a),
  })
)

const SCHOOL_ID = "sch1"
const SESSION_ID = "lcs1"
const ROOM_NAME = `sch-${SCHOOL_ID}-lc-${SESSION_ID}`

const ENV_KEYS = [
  "LIVEKIT_HOST",
  "LIVEKIT_WS_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "LIVEKIT_RECORDING_BUCKET",
  "LIVEKIT_RECORDING_REGION",
] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  vi.clearAllMocks()
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.LIVEKIT_HOST = "https://livekit.test"
  process.env.LIVEKIT_WS_URL = "wss://livekit.test"
  process.env.LIVEKIT_API_KEY = "test-key"
  process.env.LIVEKIT_API_SECRET = "test-secret-must-be-long-enough-for-hs256"
  process.env.LIVEKIT_RECORDING_BUCKET = "aldar-recordings"
  process.env.LIVEKIT_RECORDING_REGION = "me-central-1"

  vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
    id: SESSION_ID,
    recordingEnabled: true,
    school: { liveClassRecordingRetentionDays: 90 },
  } as never)
  vi.mocked(db.liveClassEvent.findUnique).mockResolvedValue(null as never)
  vi.mocked(db.liveClassEvent.create).mockResolvedValue({} as never)
  vi.mocked(db.liveClassSession.update).mockResolvedValue({} as never)
  vi.mocked(db.liveClassRecording.upsert).mockResolvedValue({} as never)
  vi.mocked(db.liveClassRecording.updateMany).mockResolvedValue({} as never)
  vi.mocked(db.liveClassParticipant.updateMany).mockResolvedValue({} as never)
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

function evt(over: Record<string, unknown>): never {
  return {
    id: `evt-${Math.random().toString(36).slice(2)}`,
    room: { name: ROOM_NAME, sid: "sid-1" },
    createdAt: BigInt(Date.now() * 1_000_000),
    ...over,
  } as never
}

describe("handleWebhookEvent — room lifecycle", () => {
  it("room_started → status=live, actualStart set, roomSid captured, notifyClassStarted fired", async () => {
    const ok = await handleWebhookEvent(evt({ event: "room_started" }))
    expect(ok).toBe(true)
    expect(db.liveClassSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SESSION_ID },
        data: expect.objectContaining({
          status: "live",
          roomSid: "sid-1",
          actualStart: expect.any(Date),
        }),
      })
    )
    expect(notifyClassStarted).toHaveBeenCalledWith(SCHOOL_ID, SESSION_ID)
  })

  it("room_finished → status=ended, actualEnd set", async () => {
    const ok = await handleWebhookEvent(evt({ event: "room_finished" }))
    expect(ok).toBe(true)
    expect(db.liveClassSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "ended",
          actualEnd: expect.any(Date),
        }),
      })
    )
  })

  it("participant_joined → updateMany joinedAt + status=joined", async () => {
    const ok = await handleWebhookEvent(
      evt({
        event: "participant_joined",
        participant: { identity: "u-stu-1" },
      })
    )
    expect(ok).toBe(true)
    expect(db.liveClassParticipant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sessionId: SESSION_ID, userId: "u-stu-1" },
        data: expect.objectContaining({ status: "joined" }),
      })
    )
  })

  it("participant_left → computes duration from joinedAt", async () => {
    const joinedAt = new Date(Date.now() - 60_000) // joined 60s ago
    vi.mocked(db.liveClassParticipant.findFirst).mockResolvedValue({
      id: "lcp-1",
      joinedAt,
    } as never)
    vi.mocked(db.liveClassParticipant.update).mockResolvedValue({} as never)
    const ok = await handleWebhookEvent(
      evt({
        event: "participant_left",
        participant: { identity: "u-stu-1" },
      })
    )
    expect(ok).toBe(true)
    expect(db.liveClassParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "left",
          leftAt: expect.any(Date),
          durationSeconds: expect.any(Number),
        }),
      })
    )
    const [[call]] = vi.mocked(db.liveClassParticipant.update).mock.calls
    const durationSec = (call?.data as { durationSeconds?: number })
      .durationSeconds
    expect(durationSec).toBeGreaterThanOrEqual(59)
    expect(durationSec).toBeLessThanOrEqual(62)
  })
})

describe("handleWebhookEvent — egress / recording", () => {
  it("egress_started → upserts with s3Bucket + s3Region from config", async () => {
    const ok = await handleWebhookEvent(
      evt({
        event: "egress_started",
        egressInfo: { egressId: "egr-1" },
      })
    )
    expect(ok).toBe(true)
    expect(db.liveClassRecording.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { egressId: "egr-1" },
        create: expect.objectContaining({
          schoolId: SCHOOL_ID,
          sessionId: SESSION_ID,
          egressId: "egr-1",
          s3Bucket: "aldar-recordings",
          s3Region: "me-central-1",
          status: "processing",
        }),
        update: expect.objectContaining({
          s3Bucket: "aldar-recordings",
          s3Region: "me-central-1",
        }),
      })
    )
  })

  it("egress_started — when LiveKit env missing, falls back to empty bucket + default region without throwing", async () => {
    delete process.env.LIVEKIT_RECORDING_BUCKET
    const ok = await handleWebhookEvent(
      evt({
        event: "egress_started",
        egressInfo: { egressId: "egr-2" },
      })
    )
    expect(ok).toBe(true)
    const upsertArg = vi.mocked(db.liveClassRecording.upsert).mock
      .calls[0]?.[0] as
      | { create: { s3Bucket?: string; s3Region?: string } }
      | undefined
    expect(upsertArg?.create.s3Bucket).toBe("")
    expect(upsertArg?.create.s3Region).toBe("me-central-1")
  })

  it("egress_ended → status=ready + expiresAt + notifyClassRecordingReady", async () => {
    const ok = await handleWebhookEvent(
      evt({
        event: "egress_ended",
        egressInfo: {
          egressId: "egr-1",
          fileResults: [
            { filename: "schools/sch1/live-class/lcs1/1.mp4", size: 12345n },
          ],
          startedAt: BigInt(Date.now() * 1_000_000),
          endedAt: BigInt((Date.now() + 60_000) * 1_000_000),
        },
      })
    )
    expect(ok).toBe(true)
    expect(db.liveClassRecording.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { egressId: "egr-1" },
        data: expect.objectContaining({
          status: "ready",
          completedAt: expect.any(Date),
          expiresAt: expect.any(Date),
          s3Key: "schools/sch1/live-class/lcs1/1.mp4",
        }),
      })
    )
    expect(notifyClassRecordingReady).toHaveBeenCalledWith(
      SCHOOL_ID,
      SESSION_ID
    )
  })

  it("egress_ended with no fileResults → still flips to ready (just no s3Key update)", async () => {
    const ok = await handleWebhookEvent(
      evt({
        event: "egress_ended",
        egressInfo: { egressId: "egr-3" },
      })
    )
    expect(ok).toBe(true)
    const call = vi.mocked(db.liveClassRecording.updateMany).mock.calls[0]?.[0]
    expect((call as { data: { status: string } }).data.status).toBe("ready")
  })
})

describe("handleWebhookEvent — idempotency + safety", () => {
  it("duplicate eventId is dropped — no side effects", async () => {
    vi.mocked(db.liveClassEvent.findUnique).mockResolvedValueOnce({
      id: "already",
    } as never)
    const ok = await handleWebhookEvent(
      evt({ event: "room_started", id: "evt-dup" })
    )
    expect(ok).toBe(false)
    expect(db.liveClassSession.update).not.toHaveBeenCalled()
    expect(notifyClassStarted).not.toHaveBeenCalled()
  })

  it("unknown room name → drops (no DB update)", async () => {
    const ok = await handleWebhookEvent(
      evt({
        event: "room_started",
        room: { name: "not-our-format", sid: "sid-x" },
      })
    )
    expect(ok).toBe(false)
    expect(db.liveClassSession.update).not.toHaveBeenCalled()
  })

  it("room name parses to a session that does not belong to this tenant → drops", async () => {
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValueOnce(
      null as never
    )
    const ok = await handleWebhookEvent(evt({ event: "room_started" }))
    expect(ok).toBe(false)
    expect(db.liveClassSession.update).not.toHaveBeenCalled()
  })

  it("every dispatched event writes a LiveClassEvent audit row", async () => {
    await handleWebhookEvent(evt({ event: "room_started", id: "audit-1" }))
    expect(db.liveClassEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          sessionId: SESSION_ID,
          eventType: "room_started",
          eventId: "audit-1",
        }),
      })
    )
  })
})
