// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { markAttendance } from "@/components/school-dashboard/attendance/actions/core"
import {
  getQuickMarkingContext,
  submitQuickAttendance,
} from "@/components/school-dashboard/attendance/actions/quick"

vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    section: { findMany: vi.fn(), findFirst: vi.fn() },
    timetable: { findMany: vi.fn() },
    schoolWeekConfig: { findMany: vi.fn() },
    attendance: { groupBy: vi.fn() },
    student: { findMany: vi.fn() },
    absenceIntention: { findMany: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
  },
}))

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// Isolate the wrapper: markAttendance itself is covered by core tests.
vi.mock(
  "@/components/school-dashboard/attendance/actions/core",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/components/school-dashboard/attendance/actions/core")
      >()
    return { ...original, markAttendance: vi.fn() }
  }
)

const SCHOOL = "school-1"

function mockAuth(role = "TEACHER", schoolId: string | null = SCHOOL) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as never,
    locale: "en",
  } as never)
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", schoolId, role },
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth("TEACHER")
  vi.mocked(db.schoolWeekConfig.findMany).mockResolvedValue([] as never)
  vi.mocked(db.timetable.findMany).mockResolvedValue([] as never)
  vi.mocked(db.attendance.groupBy).mockResolvedValue([] as never)
  vi.mocked(db.absenceIntention.findMany).mockResolvedValue([] as never)
  vi.mocked(db.studentGuardian.findMany).mockResolvedValue([] as never)
})

describe("getQuickMarkingContext", () => {
  it("rejects roles outside the marking matrix", async () => {
    mockAuth("STUDENT")
    const result = await getQuickMarkingContext()
    expect(result.success).toBe(false)
  })

  it("returns empty sections for a TEACHER with no teacher row", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
    const result = await getQuickMarkingContext()
    expect(result.success).toBe(true)
    if (result.success) expect(result.data!.sections).toEqual([])
    expect(db.section.findMany).not.toHaveBeenCalled()
  })

  it("scopes a teacher's sections and marks the current period first", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.section.findMany).mockResolvedValue([
      {
        id: "sec-b",
        name: "Grade 2-B",
        grade: { name: "Grade 2" },
        _count: { students: 25 },
      },
      {
        id: "sec-a",
        name: "Grade 1-A",
        grade: { name: "Grade 1" },
        _count: { students: 30 },
      },
    ] as never)
    // sec-a has a slot whose window covers "now"
    const mkTime = (h: number, m: number) =>
      new Date(Date.UTC(1970, 0, 1, h, m))
    const now = new Date()
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        sectionId: "sec-a",
        period: {
          name: "P1",
          startTime: mkTime(0, 0),
          endTime: mkTime(23, 59),
        },
      },
    ] as never)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([
      { sectionId: "sec-a", _count: { studentId: 30 } },
    ] as never)

    const result = await getQuickMarkingContext()
    expect(result.success).toBe(true)
    if (!result.success) return
    const sections = result.data!.sections
    expect(sections[0].id).toBe("sec-a")
    expect(sections[0].isCurrent).toBe(true)
    expect(sections[0].markedCount).toBe(30)
    expect(sections[1].id).toBe("sec-b")
    // teacher scoping applied to the section query
    const where = vi.mocked(db.section.findMany).mock.calls[0][0]!.where!
    expect(where.schoolId).toBe(SCHOOL)
    expect(where.OR).toBeDefined()
    void now
  })
})

describe("submitQuickAttendance", () => {
  const roster = [{ id: "s1" }, { id: "s2" }, { id: "s3" }]

  function mockOwnedSection() {
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.section.findFirst).mockResolvedValue({
      id: "sec-1",
    } as never)
    vi.mocked(db.student.findMany).mockResolvedValue(roster as never)
    vi.mocked(markAttendance).mockResolvedValue({
      success: true,
      data: { count: roster.length },
    } as never)
  }

  it("rejects a TEACHER submitting for a section they don't own", async () => {
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.section.findFirst).mockResolvedValue(null)
    const result = await submitQuickAttendance({
      sectionId: "sec-foreign",
      date: "2026-07-19",
      absentStudentIds: [],
      lateStudentIds: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(markAttendance).not.toHaveBeenCalled()
  })

  it("expands the roster absent-oriented and delegates to markAttendance", async () => {
    mockOwnedSection()
    const result = await submitQuickAttendance({
      sectionId: "sec-1",
      date: "2026-07-19",
      absentStudentIds: ["s2"],
      lateStudentIds: ["s3"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toMatchObject({
        total: 3,
        present: 1,
        absent: 1,
        late: 1,
      })
    }
    const call = vi.mocked(markAttendance).mock.calls[0][0]
    expect(call.sectionId).toBe("sec-1")
    expect(call.records).toEqual([
      { studentId: "s1", status: "present" },
      { studentId: "s2", status: "absent" },
      { studentId: "s3", status: "late" },
    ])
  })

  it("drops studentIds that are not in the section roster (cross-section injection)", async () => {
    mockOwnedSection()
    const result = await submitQuickAttendance({
      sectionId: "sec-1",
      date: "2026-07-19",
      absentStudentIds: ["foreign-student", "s1"],
      lateStudentIds: ["another-foreign"],
    })
    expect(result.success).toBe(true)
    const call = vi.mocked(markAttendance).mock.calls[0][0]
    const statuses = Object.fromEntries(
      call.records.map((r: { studentId: string; status: string }) => [
        r.studentId,
        r.status,
      ])
    )
    expect(statuses).toEqual({ s1: "absent", s2: "present", s3: "present" })
  })

  it("counts notifiable guardians for absent students, excluding auto-excused", async () => {
    mockOwnedSection()
    vi.mocked(db.absenceIntention.findMany).mockResolvedValue([
      { studentId: "s2" },
    ] as never)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      { studentId: "s1" },
      { studentId: "s2" },
    ] as never)
    const result = await submitQuickAttendance({
      sectionId: "sec-1",
      date: "2026-07-19",
      absentStudentIds: ["s1", "s2"],
      lateStudentIds: [],
    })
    expect(result.success).toBe(true)
    // s2 is auto-excused (approved intention) → only s1's guardian notified
    if (result.success) expect(result.data!.guardiansNotified).toBe(1)
  })

  it("skips the ownership check for ADMIN", async () => {
    mockAuth("ADMIN")
    vi.mocked(db.student.findMany).mockResolvedValue(roster as never)
    vi.mocked(markAttendance).mockResolvedValue({
      success: true,
      data: { count: 3 },
    } as never)
    const result = await submitQuickAttendance({
      sectionId: "sec-1",
      date: "2026-07-19",
      absentStudentIds: [],
      lateStudentIds: [],
    })
    expect(result.success).toBe(true)
    expect(db.section.findFirst).not.toHaveBeenCalled()
  })
})
