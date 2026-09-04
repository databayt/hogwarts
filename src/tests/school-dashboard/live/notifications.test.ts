// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Unit tests for the live-class notification helper (actions/notifications.ts).
//
// nl-02: `startingSoon`'s body must say the ACTUAL minutes-to-start (passed
// in by the cron), with correct Arabic plural-form selection — not a
// hardcoded "10 minutes".
// nl-04: the section audience must be resolved down BOTH enrollment axes —
// Student.sectionId AND StudentClass membership in the session's timetable
// slot class — deduped, with guardians following the same widened set.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"
import {
  notifyClassCancelled,
  notifyClassRecordingReady,
  notifyClassScheduled,
  notifyClassStartingSoon,
} from "@/components/school-dashboard/live/actions/notifications"

vi.mock("@/lib/db", () => ({
  db: {
    conference: { findFirst: vi.fn() },
    user: { findMany: vi.fn() },
    student: { findMany: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotificationsToAudience: vi.fn(async () => ({ created: 1 })),
}))

const mockDb = vi.mocked(db)
const mockDispatch = vi.mocked(dispatchNotificationsToAudience)

const BASE_SESSION = {
  id: "lcs-1",
  schoolId: "school-1",
  title: "Algebra I",
  sectionId: "sec-1",
  visibility: "section" as const,
  scheduledStart: new Date("2026-06-01T10:00:00Z"),
  teacher: { firstName: "Ada", lastName: "Lovelace", userId: "teacher-user-1" },
  school: { preferredLanguage: "ar" },
  timetable: { classId: "class-1" },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.conference.findFirst.mockResolvedValue(BASE_SESSION as never)
  mockDb.student.findMany.mockResolvedValue([] as never)
  mockDb.studentGuardian.findMany.mockResolvedValue([] as never)
  mockDispatch.mockResolvedValue({ created: 1 })
})

describe("notifyClassStartingSoon — nl-02: actual lead time, not a hardcoded 10", () => {
  it("substitutes the caller-provided lead minutes into the Arabic body (few: 3-10)", async () => {
    await notifyClassStartingSoon("school-1", "lcs-1", 8)
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toBe("Algebra I يبدأ خلال 8 دقائق")
    expect(call.title).toBe("فصل مباشر يبدأ قريباً")
  })

  it("uses the Arabic DUAL form (no digit) for exactly 2 minutes", async () => {
    await notifyClassStartingSoon("school-1", "lcs-1", 2)
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toBe("Algebra I يبدأ خلال دقيقتين")
  })

  it("uses the Arabic singular form (no digit) for exactly 1 minute", async () => {
    await notifyClassStartingSoon("school-1", "lcs-1", 1)
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toBe("Algebra I يبدأ خلال دقيقة")
  })

  it("uses the Arabic 'many' form for 11+ minutes", async () => {
    await notifyClassStartingSoon("school-1", "lcs-1", 45)
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toBe("Algebra I يبدأ خلال 45 دقيقة")
  })

  it("renders the English body with the actual lead, for an English-preferred school", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      ...BASE_SESSION,
      school: { preferredLanguage: "en" },
    } as never)
    await notifyClassStartingSoon("school-1", "lcs-1", 8)
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toBe("Algebra I starts in 8 minutes")
    expect(call.title).toBe("Live class starting soon")
  })

  it("defaults to 10 minutes when the caller passes no leadMinutes", async () => {
    await notifyClassStartingSoon("school-1", "lcs-1")
    const call = mockDispatch.mock.calls[0][0]
    // 10 falls in Arabic's "few" category (n % 100 in 3..10).
    expect(call.body).toBe("Algebra I يبدأ خلال 10 دقائق")
  })

  it("does not floor 0 itself — flooring to a minimum of 1 is the CRON's job", async () => {
    // notifications.ts's `dispatch` renders whatever leadMinutes it is
    // given (`leadMinutes ?? 10`, no Math.max floor) — it's route.ts that
    // computes `Math.max(1, Math.round(...))` before calling this (pinned in
    // route.test.ts). A caller that skips the cron's rounding gets exactly
    // what it asked for, including a nonsensical 0.
    await notifyClassStartingSoon("school-1", "lcs-1", 0)
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toBe("Algebra I يبدأ خلال 0 دقيقة")
  })
})

describe("notifyClass* — other kinds keep their fixed templates", () => {
  it("notifyClassScheduled renders title/teacher/when", async () => {
    await notifyClassScheduled("school-1", "lcs-1")
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toContain("Algebra I")
    expect(call.body).toContain("Ada Lovelace")
  })

  it("notifyClassCancelled substitutes the reason", async () => {
    await notifyClassCancelled("school-1", "lcs-1", "Teacher unavailable")
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toBe("Algebra I — Teacher unavailable")
  })

  it("notifyClassRecordingReady uses its own fixed body", async () => {
    await notifyClassRecordingReady("school-1", "lcs-1")
    const call = mockDispatch.mock.calls[0][0]
    expect(call.body).toBe("تسجيل Algebra I متاح للمشاهدة")
  })
})

describe("loadSession audience — nl-04: OR across Student.sectionId AND StudentClass", () => {
  it("includes a student reachable only through the legacy StudentClass axis", async () => {
    // No student rows returned via the OR-clause mock below in this test —
    // instead we assert the WHERE shape sent to db.student.findMany, since
    // that's what determines whether such a student is found at all.
    mockDb.student.findMany.mockResolvedValue([
      { id: "stu-1", userId: "student-user-1" },
    ] as never)

    await notifyClassScheduled("school-1", "lcs-1")

    const where = mockDb.student.findMany.mock.calls[0][0].where as {
      schoolId: string
      userId: { not: null }
      OR: Array<Record<string, unknown>>
    }
    expect(where.schoolId).toBe("school-1")
    expect(where.OR).toContainEqual({ sectionId: "sec-1" })
    expect(where.OR).toContainEqual({
      studentClasses: {
        some: { schoolId: "school-1", classId: "class-1" },
      },
    })

    const call = mockDispatch.mock.calls[0][0]
    expect(call.targetUserIds).toContain("student-user-1")
  })

  it("OR's on sectionId alone when the session has no timetable slot (ad-hoc)", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      ...BASE_SESSION,
      timetable: null,
    } as never)
    mockDb.student.findMany.mockResolvedValue([] as never)

    await notifyClassScheduled("school-1", "lcs-1")

    const where = mockDb.student.findMany.mock.calls[0][0].where as {
      OR: Array<Record<string, unknown>>
    }
    expect(where.OR).toEqual([{ sectionId: "sec-1" }])
  })

  it("dedupes a student who matches BOTH axes into a single recipient", async () => {
    mockDb.student.findMany.mockResolvedValue([
      { id: "stu-1", userId: "student-user-1" },
    ] as never)

    await notifyClassScheduled("school-1", "lcs-1")

    const call = mockDispatch.mock.calls[0][0]
    const occurrences = (call.targetUserIds as string[]).filter(
      (id: string) => id === "student-user-1"
    )
    expect(occurrences).toHaveLength(1)
  })

  it("resolves guardians from the SAME widened student set (by Student.id), not a fresh section-only query", async () => {
    mockDb.student.findMany.mockResolvedValue([
      { id: "stu-1", userId: "student-user-1" },
      { id: "stu-2", userId: "student-user-2" },
    ] as never)
    mockDb.studentGuardian.findMany.mockResolvedValue([
      { guardian: { userId: "guardian-user-1" } },
    ] as never)

    await notifyClassScheduled("school-1", "lcs-1")

    const guardianWhere = mockDb.studentGuardian.findMany.mock.calls[0][0]
      .where as { schoolId: string; studentId: { in: string[] } }
    expect(guardianWhere.studentId.in).toEqual(
      expect.arrayContaining(["stu-1", "stu-2"])
    )

    const call = mockDispatch.mock.calls[0][0]
    expect(call.targetUserIds).toContain("guardian-user-1")
  })

  it("always includes the teacher even with an empty roster", async () => {
    await notifyClassScheduled("school-1", "lcs-1")
    const call = mockDispatch.mock.calls[0][0]
    expect(call.targetUserIds).toContain("teacher-user-1")
  })

  it("a school-wide (visibility=school) session notifies every school user, skipping the section OR entirely", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      ...BASE_SESSION,
      visibility: "school",
      sectionId: null,
    } as never)
    mockDb.user.findMany.mockResolvedValue([
      { id: "user-a" },
      { id: "user-b" },
    ] as never)

    await notifyClassScheduled("school-1", "lcs-1")

    expect(mockDb.student.findMany).not.toHaveBeenCalled()
    const call = mockDispatch.mock.calls[0][0]
    expect(call.targetUserIds).toEqual(
      expect.arrayContaining(["user-a", "user-b", "teacher-user-1"])
    )
  })
})

describe("dispatch — best-effort error handling", () => {
  it("swallows a db error and returns created: 0 rather than throwing", async () => {
    mockDb.conference.findFirst.mockRejectedValue(new Error("db down"))
    const result = await notifyClassScheduled("school-1", "lcs-1")
    expect(result).toEqual({ created: 0 })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it("returns created: 0 without dispatching when the session doesn't exist", async () => {
    mockDb.conference.findFirst.mockResolvedValue(null as never)
    const result = await notifyClassScheduled("school-1", "missing")
    expect(result).toEqual({ created: 0 })
    expect(mockDispatch).not.toHaveBeenCalled()
  })

  it("returns created: 0 without dispatching when the resolved audience is empty", async () => {
    mockDb.conference.findFirst.mockResolvedValue({
      ...BASE_SESSION,
      teacher: { firstName: "Ada", lastName: "Lovelace", userId: null },
    } as never)
    mockDb.student.findMany.mockResolvedValue([] as never)
    const result = await notifyClassScheduled("school-1", "lcs-1")
    expect(result).toEqual({ created: 0 })
    expect(mockDispatch).not.toHaveBeenCalled()
  })
})
