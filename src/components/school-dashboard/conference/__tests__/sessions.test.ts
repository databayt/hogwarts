// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { endRoom, ensureRoom } from "@/lib/livekit/rooms"
import { getTenantContext } from "@/lib/tenant-context"

import {
  cancelLiveClass,
  createLiveClass,
  endLiveClass,
  getLiveClass,
  listLiveClasses,
  startLiveClass,
} from "../actions/sessions"

vi.mock("@/lib/db", () => ({
  db: {
    liveClassSession: {
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    liveClassParticipant: {
      upsert: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    teacher: {
      findFirst: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    guardian: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// Stub LiveKit lib so we don't hit env-var or network at module init.
vi.mock("@/lib/livekit/rooms", () => ({
  ensureRoom: vi.fn(async () => undefined),
  endRoom: vi.fn(async () => undefined),
}))
vi.mock("@/lib/livekit/room-naming", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/livekit/room-naming")
  >("@/lib/livekit/room-naming")
  return actual
})

// Notification helpers fire as best-effort `void` — stub to keep tests fast.
vi.mock("../actions/notifications", () => ({
  notifyClassScheduled: vi.fn(async () => ({ created: 0 })),
  notifyClassCancelled: vi.fn(async () => ({ created: 0 })),
  notifyClassStartingSoon: vi.fn(async () => ({ created: 0 })),
  notifyClassStarted: vi.fn(async () => ({ created: 0 })),
  notifyClassRecordingReady: vi.fn(async () => ({ created: 0 })),
}))

const SCHOOL_ID = "school-aldar"
const TEACHER_USER_ID = "u-teacher-1"
const TEACHER_ID = "t-1"
const SESSION_ID = "lcs-1"

function mockAdmin(schoolId = SCHOOL_ID) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u-admin", role: "ADMIN" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role: "ADMIN",
    isPlatformAdmin: false,
  } as never)
}

function mockTeacher(userId = TEACHER_USER_ID, schoolId = SCHOOL_ID) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, role: "TEACHER" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role: "TEACHER",
    isPlatformAdmin: false,
  } as never)
}

function mockStudent(userId = "u-stu-1", schoolId = SCHOOL_ID) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: userId, role: "STUDENT" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role: "STUDENT",
    isPlatformAdmin: false,
  } as never)
}

function mockUnauth() {
  vi.mocked(auth).mockResolvedValue(null as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    requestId: null,
    role: null,
    isPlatformAdmin: false,
  } as never)
}

const goodInput = {
  title: "Algebra review",
  description: "Chapters 4-6",
  lang: "ar",
  teacherId: TEACHER_ID,
  sectionId: "sec-1",
  subjectId: "sub-1",
  scheduledStart: new Date("2026-06-01T09:00:00Z").toISOString(),
  scheduledEnd: new Date("2026-06-01T10:00:00Z").toISOString(),
  recordingEnabled: true,
  maxParticipants: 50,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    liveClassMaxDurationMinutes: 120,
    liveClassRecordingDefault: true,
    preferredLanguage: "ar",
  } as never)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({
    id: TEACHER_ID,
    userId: TEACHER_USER_ID,
  } as never)
  vi.mocked(db.liveClassSession.create).mockResolvedValue({
    id: SESSION_ID,
  } as never)
  vi.mocked(db.liveClassSession.update).mockResolvedValue({
    id: SESSION_ID,
    roomName: `sch-${SCHOOL_ID}-lc-${SESSION_ID}`,
  } as never)
  vi.mocked(db.liveClassParticipant.upsert).mockResolvedValue({} as never)
})

describe("createLiveClass", () => {
  it("admin creates → returns session + final roomName + invites teacher as HOST", async () => {
    mockAdmin()
    const result = await createLiveClass(goodInput)
    expect("success" in result && result.success).toBe(true)
    if (!("success" in result) || !result.success) return
    expect(result.data.roomName).toBe(`sch-${SCHOOL_ID}-lc-${SESSION_ID}`)
    expect(db.liveClassSession.create).toHaveBeenCalled()
    expect(db.liveClassParticipant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ role: "HOST" }),
      })
    )
  })

  it("teacher creating own class succeeds (auto-resolves their teacherId)", async () => {
    mockTeacher()
    const result = await createLiveClass({
      ...goodInput,
      teacherId: TEACHER_ID,
    })
    expect("success" in result && result.success).toBe(true)
  })

  it("teacher cannot create a class for another teacher → UNAUTHORIZED", async () => {
    mockTeacher()
    // findFirst returns the calling teacher (id=TEACHER_ID), input asks for a different teacher
    const result = await createLiveClass({ ...goodInput, teacherId: "t-other" })
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("UNAUTHORIZED")
  })

  it("unauthenticated → NOT_AUTHENTICATED", async () => {
    mockUnauth()
    const result = await createLiveClass(goodInput)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(["NOT_AUTHENTICATED", "MISSING_SCHOOL"]).toContain(result.error)
  })

  it("duration > school max → LIVE_CLASS_MAX_DURATION_EXCEEDED", async () => {
    mockAdmin()
    vi.mocked(db.school.findUnique).mockResolvedValue({
      liveClassMaxDurationMinutes: 30,
      liveClassRecordingDefault: true,
      preferredLanguage: "ar",
    } as never)
    const result = await createLiveClass(goodInput) // 60 min
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(result.error).toBe("LIVE_CLASS_MAX_DURATION_EXCEEDED")
  })

  it("missing teacher in school → TEACHER_NOT_FOUND", async () => {
    mockAdmin()
    vi.mocked(db.teacher.findFirst).mockResolvedValue(null as never)
    const result = await createLiveClass(goodInput)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("TEACHER_NOT_FOUND")
  })

  it("validation error on end <= start → VALIDATION_ERROR", async () => {
    mockAdmin()
    const result = await createLiveClass({
      ...goodInput,
      scheduledEnd: goodInput.scheduledStart,
    })
    expect("success" in result && result.success).toBe(false)
  })
})

describe("cancelLiveClass", () => {
  it("admin cancels a scheduled class → flips to cancelled", async () => {
    mockAdmin()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "scheduled",
    } as never)
    const result = await cancelLiveClass({ id: SESSION_ID, reason: "Sick" })
    expect("success" in result && result.success).toBe(true)
    expect(db.liveClassSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "cancelled" }),
      })
    )
  })

  it("cannot cancel a live class → LIVE_CLASS_INVALID_STATE", async () => {
    mockAdmin()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "live",
    } as never)
    const result = await cancelLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("LIVE_CLASS_INVALID_STATE")
  })

  it("not found → LIVE_CLASS_NOT_FOUND", async () => {
    mockAdmin()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue(null as never)
    const result = await cancelLiveClass({ id: "missing" })
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("LIVE_CLASS_NOT_FOUND")
  })

  it("teacher (no manage_live_class permission) → UNAUTHORIZED", async () => {
    mockTeacher()
    const result = await cancelLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("UNAUTHORIZED")
  })
})

describe("startLiveClass", () => {
  it("teacher starts own scheduled class → ensures room, flips to live", async () => {
    mockTeacher()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "scheduled",
      roomName: `sch-${SCHOOL_ID}-lc-${SESSION_ID}`,
      maxParticipants: 50,
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await startLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(true)
    expect(ensureRoom).toHaveBeenCalled()
    expect(db.liveClassSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "live" }),
      })
    )
  })

  it("teacher cannot start another teacher's class → UNAUTHORIZED", async () => {
    mockTeacher("u-other-teacher")
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "scheduled",
      roomName: "x",
      maxParticipants: 50,
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await startLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("UNAUTHORIZED")
  })

  it("already-live class → no-op success (idempotent)", async () => {
    mockTeacher()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "live",
      roomName: "x",
      maxParticipants: 50,
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await startLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(true)
    expect(ensureRoom).not.toHaveBeenCalled()
  })

  it("ended class cannot be re-started → LIVE_CLASS_INVALID_STATE", async () => {
    mockTeacher()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "ended",
      roomName: "x",
      maxParticipants: 50,
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await startLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(false)
    if ("error" in result) expect(result.error).toBe("LIVE_CLASS_INVALID_STATE")
  })

  it("LiveKit unavailable → LIVE_CLASS_PROVIDER_UNAVAILABLE", async () => {
    mockTeacher()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "scheduled",
      roomName: "x",
      maxParticipants: 50,
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    vi.mocked(ensureRoom).mockRejectedValueOnce(new Error("ECONNREFUSED"))
    const result = await startLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(result.error).toBe("LIVE_CLASS_PROVIDER_UNAVAILABLE")
  })
})

describe("endLiveClass", () => {
  it("teacher ends own live class → kicks room + flips to ended", async () => {
    mockTeacher()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "live",
      roomName: "x",
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await endLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(true)
    expect(endRoom).toHaveBeenCalled()
  })

  it("already-ended class → no-op success", async () => {
    mockTeacher()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "ended",
      roomName: "x",
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    const result = await endLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(true)
    expect(endRoom).not.toHaveBeenCalled()
  })

  it("SFU endRoom failure is swallowed (best-effort) — status still flips", async () => {
    mockTeacher()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
      status: "live",
      roomName: "x",
      teacher: { userId: TEACHER_USER_ID },
    } as never)
    vi.mocked(endRoom).mockRejectedValueOnce(new Error("404"))
    const result = await endLiveClass({ id: SESSION_ID })
    expect("success" in result && result.success).toBe(true)
    expect(db.liveClassSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "ended" }),
      })
    )
  })
})

describe("listLiveClasses", () => {
  it("admin lists all sessions in school", async () => {
    mockAdmin()
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([] as never)
    const result = await listLiveClasses()
    expect("success" in result && result.success).toBe(true)
    expect(db.liveClassSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_ID }),
      })
    )
  })

  it("teacher list is scoped to own teacherId", async () => {
    mockTeacher()
    vi.mocked(db.teacher.findFirst).mockResolvedValue({
      id: TEACHER_ID,
    } as never)
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([] as never)
    await listLiveClasses()
    expect(db.liveClassSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: SCHOOL_ID,
          teacherId: TEACHER_ID,
        }),
      })
    )
  })

  it("student list is scoped to own sectionId", async () => {
    mockStudent()
    vi.mocked(db.student.findFirst).mockResolvedValue({
      sectionId: "sec-1",
    } as never)
    vi.mocked(db.liveClassSession.findMany).mockResolvedValue([] as never)
    await listLiveClasses()
    expect(db.liveClassSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: SCHOOL_ID,
          sectionId: "sec-1",
        }),
      })
    )
  })

  it("student without section returns empty list", async () => {
    mockStudent()
    vi.mocked(db.student.findFirst).mockResolvedValue({
      sectionId: null,
    } as never)
    const result = await listLiveClasses()
    expect("success" in result && result.success).toBe(true)
    if ("success" in result && result.success) {
      expect(result.data).toEqual([])
    }
  })
})

describe("getLiveClass (tenant-leak guard)", () => {
  it("scopes findFirst by resolved schoolId", async () => {
    mockAdmin()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
    } as never)
    await getLiveClass(SESSION_ID)
    expect(db.liveClassSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: SESSION_ID,
          schoolId: SCHOOL_ID,
          deletedAt: null,
        }),
      })
    )
  })

  it("student gets schoolId from join_as_participant when not staff", async () => {
    mockStudent()
    vi.mocked(db.liveClassSession.findFirst).mockResolvedValue({
      id: SESSION_ID,
    } as never)
    await getLiveClass(SESSION_ID)
    expect(db.liveClassSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          schoolId: SCHOOL_ID,
        }),
      })
    )
  })

  it("truly unauthenticated → UNAUTHORIZED (no DB call)", async () => {
    mockUnauth()
    const result = await getLiveClass(SESSION_ID)
    expect("success" in result && result.success).toBe(false)
    if ("error" in result)
      expect(["UNAUTHORIZED", "NOT_AUTHENTICATED", "MISSING_SCHOOL"]).toContain(
        result.error
      )
    expect(db.liveClassSession.findFirst).not.toHaveBeenCalled()
  })
})
