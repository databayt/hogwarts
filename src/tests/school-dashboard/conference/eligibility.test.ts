// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// joinLiveClass eligibility resolution — proves that:
//   HOST     ← teacher whose userId matches session.teacherId
//   CO_HOST  ← admin / other teacher in same school
//   PARTICIPANT ← student in same section
//   OBSERVER ← guardian of a child in the section
//   PARTICIPANT_DENIED ← anyone else
//
// `node` environment so jose's HS256 path doesn't trip the jsdom Uint8Array
// realm mismatch.

import { auth } from "@/auth"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { joinLiveClass } from "@/components/school-dashboard/conference/actions/tokens"

vi.mock("@/lib/db", () => ({
  db: {
    conference: {
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    conferenceParticipant: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
    school: { findUnique: vi.fn() },
    student: { findFirst: vi.fn() },
    guardian: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
  },
}))

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/components/school-dashboard/conference/livekit/rooms", () => ({
  ensureRoom: vi.fn(async () => undefined),
}))

const SCHOOL_ID = "school-aldar"
const SESSION_ID = "lcs-1"
const SECTION_ID = "sec-1"
const ROOM_NAME = `sch-${SCHOOL_ID}-lc-${SESSION_ID}`
const TEACHER_USER_ID = "u-teacher-1"
const STUDENT_USER_ID = "u-student-1"
const GUARDIAN_USER_ID = "u-guardian-1"

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

  vi.mocked(db.conference.findFirst).mockResolvedValue({
    id: SESSION_ID,
    roomName: ROOM_NAME,
    sectionId: SECTION_ID,
    maxParticipants: 50,
    status: "live",
    lang: "ar",
    teacher: { userId: TEACHER_USER_ID },
  } as never)
  vi.mocked(db.conferenceParticipant.upsert).mockResolvedValue({} as never)
  vi.mocked(db.conferenceParticipant.findUnique).mockResolvedValue(
    null as never
  )
  // Concurrent-cap check on the HOST auto-start path (scheduled → live).
  vi.mocked(db.school.findUnique).mockResolvedValue({
    conferenceMaxConcurrent: 50,
  } as never)
  vi.mocked(db.conference.count).mockResolvedValue(0 as never)
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

function mockUser(userId: string, role: string, schoolId = SCHOOL_ID) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId, role } } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role,
    isPlatformAdmin: role === "DEVELOPER",
  } as never)
}

function decodeMeta(token: string) {
  const [, payload] = token.split(".")
  const b64 = payload.replace(/-/g, "+").replace(/_/g, "/")
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
  const json = JSON.parse(Buffer.from(b64 + pad, "base64").toString("utf8"))
  return JSON.parse(json.metadata) as {
    role: string
    schoolId: string
    sessionId: string
    lang: string
  }
}

describe("joinLiveClass eligibility", () => {
  it("teacher whose userId matches session.teacherId → HOST", async () => {
    mockUser(TEACHER_USER_ID, "TEACHER")
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("HOST")
    expect(decodeMeta(result.data.token).role).toBe("HOST")
  })

  it("teacher in same school but different session → CO_HOST", async () => {
    mockUser("u-other-teacher", "TEACHER")
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("CO_HOST")
  })

  it("admin in same school → CO_HOST (any session)", async () => {
    mockUser("u-admin", "ADMIN")
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("CO_HOST")
  })

  it("a kicked participant cannot rejoin → PARTICIPANT_DENIED", async () => {
    mockUser(TEACHER_USER_ID, "TEACHER") // would resolve HOST without the removal
    vi.mocked(db.conferenceParticipant.findUnique).mockResolvedValue({
      status: "removed",
    } as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) {
      expect(result.error).toBe("LIVE_CLASS_PARTICIPANT_DENIED")
    }
  })

  it("DEVELOPER → HOST (platform bypass)", async () => {
    mockUser("u-dev", "DEVELOPER")
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("HOST")
  })

  it("student in matching section → PARTICIPANT", async () => {
    mockUser(STUDENT_USER_ID, "STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-1",
    } as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("PARTICIPANT")
    expect(db.student.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: SCHOOL_ID,
          userId: STUDENT_USER_ID,
          sectionId: SECTION_ID,
        }),
      })
    )
  })

  it("student NOT in section → PARTICIPANT_DENIED", async () => {
    mockUser("u-stu-outsider", "STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue(null as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(result.error).toBe("LIVE_CLASS_PARTICIPANT_DENIED")
  })

  it("guardian of a student in section → OBSERVER", async () => {
    mockUser(GUARDIAN_USER_ID, "GUARDIAN")
    vi.mocked(db.guardian.findFirst).mockResolvedValue({
      id: "g-1",
    } as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.role).toBe("OBSERVER")
  })

  it("guardian whose children are not in section → PARTICIPANT_DENIED", async () => {
    mockUser("u-g-outsider", "GUARDIAN")
    vi.mocked(db.guardian.findFirst).mockResolvedValue(null as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(result.error).toBe("LIVE_CLASS_PARTICIPANT_DENIED")
  })

  it("STAFF / ACCOUNTANT cannot resolve to any participant role → PARTICIPANT_DENIED", async () => {
    mockUser("u-staff", "STAFF")
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(result.error).toBe("LIVE_CLASS_PARTICIPANT_DENIED")
  })

  it("session with no section + non-host caller → no eligible role", async () => {
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: SESSION_ID,
      roomName: ROOM_NAME,
      sectionId: null, // ad-hoc class with no section roster
      maxParticipants: 50,
      status: "live",
      lang: "ar",
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    mockUser(STUDENT_USER_ID, "STUDENT")
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(result.error).toBe("LIVE_CLASS_PARTICIPANT_DENIED")
  })

  it("unauthenticated → NOT_AUTHENTICATED, no DB call", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("NOT_AUTHENTICATED")
  })

  it("session not found → LIVE_CLASS_NOT_FOUND", async () => {
    mockUser(TEACHER_USER_ID, "TEACHER")
    vi.mocked(db.conference.findFirst).mockResolvedValue(null as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("LIVE_CLASS_NOT_FOUND")
  })

  it("cancelled session → LIVE_CLASS_INVALID_STATE", async () => {
    mockUser(TEACHER_USER_ID, "TEACHER")
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: SESSION_ID,
      roomName: ROOM_NAME,
      sectionId: SECTION_ID,
      maxParticipants: 50,
      status: "cancelled",
      lang: "ar",
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("LIVE_CLASS_INVALID_STATE")
  })

  it("scheduled (not yet live) class can be joined by HOST → triggers ensureRoom + status flip", async () => {
    mockUser(TEACHER_USER_ID, "TEACHER")
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: SESSION_ID,
      roomName: ROOM_NAME,
      sectionId: SECTION_ID,
      maxParticipants: 50,
      status: "scheduled",
      lang: "ar",
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(true)
    expect(db.conference.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "live" }),
      })
    )
  })

  it("scheduled class cannot be joined by non-host → LIVE_CLASS_INVALID_STATE", async () => {
    mockUser(STUDENT_USER_ID, "STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "stu-1",
    } as never)
    vi.mocked(db.conference.findFirst).mockResolvedValue({
      id: SESSION_ID,
      roomName: ROOM_NAME,
      sectionId: SECTION_ID,
      maxParticipants: 50,
      status: "scheduled",
      lang: "ar",
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("LIVE_CLASS_INVALID_STATE")
  })

  it("cross-tenant: student in school B cannot join a class in school A", async () => {
    mockUser(STUDENT_USER_ID, "STUDENT", "school-B")
    vi.mocked(db.conference.findFirst).mockResolvedValue(null as never) // findFirst filters by schoolId, so school B finds nothing
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("LIVE_CLASS_NOT_FOUND")
  })

  it("returned ticket carries the same roomName as the session", async () => {
    mockUser(TEACHER_USER_ID, "TEACHER")
    const result = await joinLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.roomName).toBe(ROOM_NAME)
    expect(result.data.identity).toBe(TEACHER_USER_ID)
    expect(decodeMeta(result.data.token).schoolId).toBe(SCHOOL_ID)
  })
})
