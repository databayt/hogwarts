// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getStudentScopes } from "@/lib/teaching-scope"
import {
  getParentDashboardData,
  getStudentDashboardData,
  getTeacherDashboardData,
} from "@/components/school-dashboard/dashboard/actions"
import { buildViewerAudienceWhere } from "@/components/school-dashboard/listings/announcements/queries"

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
  revalidatePath: vi.fn(),
}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn() },
    school: { findUnique: vi.fn() },
    subjectTeacher: { findMany: vi.fn() },
    timetable: { findMany: vi.fn() },
    result: { groupBy: vi.fn() },
    assignmentSubmission: { count: vi.fn() },
    schoolAssignment: { findMany: vi.fn() },
    schoolExam: { findMany: vi.fn() },
    student: { count: vi.fn(), findFirst: vi.fn() },
    attendance: { findMany: vi.fn(), count: vi.fn() },
    examResult: { findMany: vi.fn() },
    announcement: { findMany: vi.fn() },
    guardian: { findFirst: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
    term: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn().mockResolvedValue({ term: { id: "term-1" } }),
}))
vi.mock("@/lib/teaching-scope", () => ({ getStudentScopes: vi.fn() }))
vi.mock("@/components/school-dashboard/listings/announcements/queries", () => ({
  buildViewerAudienceWhere: vi
    .fn()
    .mockResolvedValue({ published: true, OR: [{ scope: "school" }] }),
}))
vi.mock("@/components/school-dashboard/timetable/live-class-join", () => ({
  attachLiveClasses: vi.fn(
    async (_s: string, _t: string, _n: Date, slots: unknown[]) =>
      slots.map((slot) => ({ ...(slot as object), liveClass: null }))
  ),
}))

const SCHOOL = "school-1"

function as(role: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", schoolId: SCHOOL, role },
  } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(db.school.findUnique).mockResolvedValue({
    timezone: "UTC",
  } as never)
  vi.mocked(db.timetable.findMany).mockResolvedValue([])
  vi.mocked(db.result.groupBy).mockResolvedValue([] as never)
  vi.mocked(db.assignmentSubmission.count).mockResolvedValue(0)
  vi.mocked(db.schoolAssignment.findMany).mockResolvedValue([])
  vi.mocked(db.schoolExam.findMany).mockResolvedValue([])
  vi.mocked(db.student.count).mockResolvedValue(0)
  vi.mocked(db.attendance.findMany).mockResolvedValue([])
  vi.mocked(db.attendance.count).mockResolvedValue(0)
  vi.mocked(db.examResult.findMany).mockResolvedValue([])
  vi.mocked(db.announcement.findMany).mockResolvedValue([])
  vi.mocked(db.term.findFirst).mockResolvedValue(null)
})

describe("teacher dashboard", () => {
  beforeEach(() => {
    as("TEACHER")
    vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
    vi.mocked(db.subjectTeacher.findMany).mockResolvedValue([
      {
        sectionId: "7a",
        subjectId: "math",
        termId: "term-1",
        section: { gradeId: "g7", name: "7-A" },
        subject: { name: "Math" },
      },
    ] as never)
  })

  it("reads the work the teacher's subjects cover, not their classes", async () => {
    await getTeacherDashboardData()

    const grading = vi.mocked(db.assignmentSubmission.count).mock.calls[0][0]!
      .where as { assignment: { OR: unknown[] } }
    expect(grading.assignment.OR).toEqual(
      expect.arrayContaining([
        { createdById: "user-1" },
        { subjectId: "math", sectionId: { in: ["7a"] } },
        { subjectId: "math", sectionId: null, gradeId: { in: ["g7"] } },
      ])
    )
    const exams = vi.mocked(db.schoolExam.findMany).mock.calls[0][0]!.where as {
      OR: unknown[]
    }
    expect(exams.OR).toEqual(
      expect.arrayContaining([
        { createdById: "user-1" },
        { subjectId: "math", sectionId: { in: ["7a"] } },
      ])
    )
  })

  it("names each section·subject's average and counts unmarked sections", async () => {
    vi.mocked(db.result.groupBy).mockResolvedValue([
      { sectionId: "7a", subjectId: "math", _avg: { percentage: 81.237 } },
    ] as never)
    vi.mocked(db.timetable.findMany).mockResolvedValue([
      {
        id: "slot-1",
        sectionId: "7a",
        section: { name: "7-A", _count: { students: 20 } },
      },
      {
        id: "slot-2",
        sectionId: "7b",
        section: { name: "7-B", _count: { students: 20 } },
      },
      {
        id: "slot-3",
        sectionId: "7a",
        section: { name: "7-A", _count: { students: 20 } },
      },
    ] as never)
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { sectionId: "7a" },
    ] as never)

    const data = await getTeacherDashboardData()

    expect(data.classPerformance).toEqual([
      { className: "Math · 7-A", average: 81.24 },
    ])
    // 7-A is marked today; 7-B is not
    expect(data.attendanceDue).toBe(1)
    expect(
      vi.mocked(db.attendance.findMany).mock.calls[0][0]!.where
    ).toMatchObject({ schoolId: SCHOOL, sectionId: { in: ["7a", "7b"] } })
  })
})

describe("student dashboard", () => {
  it("lists the work and notices of the student's section and grade", async () => {
    as("STUDENT")
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "s1",
      sectionId: "7a",
    } as never)
    vi.mocked(getStudentScopes).mockResolvedValue([
      { studentId: "s1", sectionId: "7a", gradeId: "g7" },
    ])

    await getStudentDashboardData()

    expect(
      vi.mocked(db.schoolAssignment.findMany).mock.calls[0][0]!.where
    ).toMatchObject({
      schoolId: SCHOOL,
      OR: [
        { sectionId: { in: ["7a"] } },
        { sectionId: null, gradeId: { in: ["g7"] } },
      ],
    })
    expect(buildViewerAudienceWhere).toHaveBeenCalledWith(
      SCHOOL,
      "user-1",
      "STUDENT"
    )
  })
})

describe("parent dashboard", () => {
  it("finds children through the guardian record, not the user id", async () => {
    as("GUARDIAN")
    vi.mocked(db.guardian.findFirst).mockResolvedValue({
      id: "guardian-9",
    } as never)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      {
        student: {
          id: "s1",
          studentId: "26030001",
          firstName: "Khadija",
          middleName: null,
          lastName: "Alnoor",
        },
      },
    ] as never)
    vi.mocked(getStudentScopes).mockResolvedValue([
      { studentId: "s1", sectionId: "7a", gradeId: "g7" },
    ])

    const data = await getParentDashboardData()

    expect(vi.mocked(db.guardian.findFirst).mock.calls[0][0]).toEqual({
      where: { userId: "user-1", schoolId: SCHOOL },
      select: { id: true },
    })
    expect(
      vi.mocked(db.studentGuardian.findMany).mock.calls[0][0]!.where
    ).toEqual({ guardianId: "guardian-9", schoolId: SCHOOL })
    expect(data.children).toEqual([
      { id: "s1", studentId: "26030001", name: "Khadija  Alnoor" },
    ])
    expect(buildViewerAudienceWhere).toHaveBeenCalledWith(
      SCHOOL,
      "user-1",
      "GUARDIAN"
    )
  })

  it("shows no children for a user with no guardian record", async () => {
    as("GUARDIAN")
    vi.mocked(db.guardian.findFirst).mockResolvedValue(null)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([])

    const data = await getParentDashboardData()

    expect(data.children).toEqual([])
  })
})
