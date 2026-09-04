// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// The JWT-actor branch of `performLiveClassJoin` (join-core.ts) — the one the
// mobile join route uses via `{ actor: { userId, role, schoolId } }`, bypassing
// auth()/getTenantContext() entirely — was never exercised by any test before
// this file: eligibility.test.ts only drives the session branch (via
// `joinLiveClass`), and both mobile/token route specs mock `performLiveClassJoin`
// itself out, so the branch that actually resolves a phone's role was unproven.
//
// This proves two things the finding named: (1) the actor branch resolves a
// role identically to the session branch for the same user/session, and (2)
// `actor.schoolId` scopes the read exactly like `getTenantContext().schoolId`
// does on the web path — a mismatched schoolId finds nothing, never another
// school's session.
//
// `node` environment so jose's HS256 path doesn't trip the jsdom Uint8Array
// realm mismatch (same reason eligibility.test.ts pins it).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { performLiveClassJoin } from "@/components/school-dashboard/live/actions/join-core"

/** The `school` columns `performLiveClassJoin` selects for `roomConfig`. */
const SCHOOL_ROOM_CONFIG = {
  conferenceGuardiansObserve: true,
  conferenceStudentsJoinMuted: true,
  conferenceRecordingConsentNote: null,
  conferenceToolChat: true,
  conferenceToolHands: true,
  conferenceToolPolls: true,
  conferenceToolWhiteboard: true,
  conferenceToolStudentShare: false,
}

vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    conferenceParticipant: { upsert: vi.fn(), findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))
vi.mock("@/components/school-dashboard/live/livekit/rooms", () => ({
  ensureRoom: vi.fn(async () => undefined),
  addRoomHost: vi.fn(async () => undefined),
}))

const SCHOOL_ID = "school-aldar"
const OTHER_SCHOOL_ID = "school-other"
const SESSION_ID = "lcs-1"
const SECTION_ID = "sec-1"
const ROOM_NAME = `sch-${SCHOOL_ID}-lc-${SESSION_ID}`
const TEACHER_USER_ID = "u-teacher-1"

const ENV_KEYS = [
  "LIVEKIT_HOST",
  "LIVEKIT_WS_URL",
  "LIVEKIT_API_KEY",
  "LIVEKIT_API_SECRET",
  "LIVEKIT_RECORDING_BUCKET",
] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  vi.clearAllMocks()
  for (const k of ENV_KEYS) saved[k] = process.env[k]
  process.env.LIVEKIT_HOST = "https://livekit.test"
  process.env.LIVEKIT_WS_URL = "wss://livekit.test"
  process.env.LIVEKIT_API_KEY = "test-key"
  process.env.LIVEKIT_API_SECRET = "test-secret-must-be-long-enough-for-hs256"
  process.env.LIVEKIT_RECORDING_BUCKET = "test-bucket"

  // Scoped exactly like the session branch's `getTenantContext().schoolId`
  // scopes its read on the web path: only a matching schoolId finds the row.
  vi.mocked(db.conference.findFirst).mockImplementation(async (args) => {
    const where = (args as { where: { schoolId: string } }).where
    if (where.schoolId !== SCHOOL_ID) return null as never
    return {
      id: SESSION_ID,
      roomName: ROOM_NAME,
      provider: "livekit",
      recordingEnabled: true,
      studentsJoinMuted: null,
      sectionId: SECTION_ID,
      maxParticipants: 50,
      status: "live",
      lang: "ar",
      teacher: { userId: TEACHER_USER_ID },
      school: SCHOOL_ROOM_CONFIG,
    } as never
  })
  vi.mocked(db.conferenceParticipant.upsert).mockResolvedValue({} as never)
  vi.mocked(db.conferenceParticipant.findUnique).mockResolvedValue(
    null as never
  )
  vi.mocked(db.user.findUnique).mockResolvedValue({
    username: "Test User",
    email: "test@x.test",
  } as never)
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k]
    else process.env[k] = saved[k]
  }
})

describe("performLiveClassJoin — JWT actor branch", () => {
  it("owning teacher via actor → HOST, same as the session branch resolves for the same user", async () => {
    const result = await performLiveClassJoin(SESSION_ID, {
      actor: { userId: TEACHER_USER_ID, role: "TEACHER", schoolId: SCHOOL_ID },
    })
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("HOST")
  })

  it("a different school TEACHER via actor → CO_HOST, matching resolveParticipantRole's unconditional co-teaching rule", async () => {
    const result = await performLiveClassJoin(SESSION_ID, {
      actor: {
        userId: "u-other-teacher",
        role: "TEACHER",
        schoolId: SCHOOL_ID,
      },
    })
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("CO_HOST")
  })

  it("ADMIN via actor → CO_HOST", async () => {
    const result = await performLiveClassJoin(SESSION_ID, {
      actor: { userId: "u-admin", role: "ADMIN", schoolId: SCHOOL_ID },
    })
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("CO_HOST")
  })

  it("actor.schoolId scopes the read — a mismatched schoolId finds nothing, not another school's session", async () => {
    const result = await performLiveClassJoin(SESSION_ID, {
      actor: {
        userId: TEACHER_USER_ID,
        role: "TEACHER",
        schoolId: OTHER_SCHOOL_ID,
      },
    })
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) {
      expect(result.error).toBe("LIVE_CLASS_NOT_FOUND")
    }
    expect(db.conference.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: SESSION_ID,
          schoolId: OTHER_SCHOOL_ID,
        }),
      })
    )
  })
})
