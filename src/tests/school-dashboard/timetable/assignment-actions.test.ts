// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  assignTeacher,
  saveTeacherSubjects,
  unassignTeacher,
} from "@/components/school-dashboard/timetable/assignments/actions"
import {
  applyAssignment,
  unassignPairs,
} from "@/components/school-dashboard/timetable/assignments/apply"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/term-resolver", () => ({ resolveActiveTerm: vi.fn() }))
vi.mock("@/lib/refresh-page", () => ({ refreshPage: vi.fn() }))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/components/translation/locale", () => ({
  getDisplayLang: vi.fn().mockResolvedValue("en"),
}))
vi.mock("@/components/translation/person", () => ({
  getLabels: vi.fn().mockResolvedValue(new Map()),
  getNames: vi.fn().mockResolvedValue(new Map()),
}))
vi.mock("@/components/school-dashboard/timetable/permissions", () => ({
  logTimetableAction: vi.fn().mockResolvedValue({}),
}))
vi.mock("@/components/school-dashboard/timetable/assignments/apply", () => ({
  applyAssignment: vi.fn(),
  unassignPairs: vi.fn().mockResolvedValue({ cleared: 0 }),
}))
vi.mock("@/lib/db", () => ({
  db: {
    teacher: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) },
    section: {
      count: vi.fn(),
      findMany: vi.fn().mockResolvedValue([]),
    },
    period: { findMany: vi.fn().mockResolvedValue([]) },
    school: { findFirst: vi.fn().mockResolvedValue(null) },
    subjectTeacher: { findMany: vi.fn() },
    teacherConstraint: { findFirst: vi.fn().mockResolvedValue(null) },
    workloadConfig: { findUnique: vi.fn().mockResolvedValue(null) },
    timetable: { count: vi.fn(), findMany: vi.fn() },
    subjectSelection: { findMany: vi.fn().mockResolvedValue([]) },
    teacherSubjectExpertise: {
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn((args: unknown) => ({ op: "deleteMany", args })),
      createMany: vi.fn((args: unknown) => ({ op: "createMany", args })),
    },
    $transaction: vi.fn().mockResolvedValue([]),
  },
}))

const SCHOOL = "school-1"
const TERM = "term-1"

function as(role: string | null) {
  vi.mocked(auth).mockResolvedValue(
    (role ? { user: { id: "user-1", role, schoolId: SCHOOL } } : null) as never
  )
}

const outcome = {
  ok: true as const,
  termId: TERM,
  teacherId: "t1",
  subjectId: "math",
  assigned: 10,
  scheduled: 10,
  moved: 2,
  released: 0,
  residual: [],
  load: { periodsPerWeek: 10, cap: 25 },
  affectedTeacherIds: [],
  dryRun: false,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getTenantContext).mockResolvedValue({ schoolId: SCHOOL } as never)
  vi.mocked(resolveActiveTerm).mockResolvedValue({
    term: { id: TERM, yearId: "y1" },
  } as never)
  vi.mocked(applyAssignment).mockResolvedValue(outcome)
  vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
  vi.mocked(db.timetable.count).mockResolvedValue(0)
  vi.mocked(db.timetable.findMany).mockResolvedValue([])
})

describe("assignTeacher", () => {
  it("refuses an unauthenticated caller", async () => {
    as(null)
    const res = await assignTeacher({
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A"],
    })
    expect(res).toMatchObject({ success: false, error: "NOT_AUTHENTICATED" })
    expect(applyAssignment).not.toHaveBeenCalled()
  })

  it("refuses a read-only role", async () => {
    as("TEACHER")
    const res = await assignTeacher({
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A"],
    })
    expect(res).toMatchObject({ success: false, error: "UNAUTHORIZED" })
  })

  it("rejects malformed input", async () => {
    as("ADMIN")
    const res = await assignTeacher({ teacherId: "t1", sectionIds: [] })
    expect(res).toMatchObject({ success: false, error: "VALIDATION_ERROR" })
  })

  it("needs an active term", async () => {
    as("ADMIN")
    vi.mocked(resolveActiveTerm).mockResolvedValue({ term: null } as never)
    const res = await assignTeacher({
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A"],
    })
    expect(res).toMatchObject({ success: false, error: "NO_ACTIVE_TERM" })
  })

  it("assigns with the school and term it resolved, respecting the cap", async () => {
    as("ADMIN")
    const res = await assignTeacher({
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A", "7B"],
    })
    expect(res.success).toBe(true)
    expect(applyAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: SCHOOL,
        termId: TERM,
        teacherId: "t1",
        subjectId: "math",
        sectionIds: ["7A", "7B"],
        respectCap: true,
        assignedById: "user-1",
      })
    )
    expect(res).toMatchObject({ data: { assigned: 10, moved: 2 } })
  })

  it("passes the projected load back when the cap would be exceeded", async () => {
    as("ADMIN")
    vi.mocked(applyAssignment).mockResolvedValue({
      ok: false,
      code: "TEACHER_OVER_CAP",
      load: { periodsPerWeek: 30, cap: 25 },
    })
    const res = await assignTeacher({
      teacherId: "t1",
      subjectId: "math",
      sectionIds: ["7A"],
    })
    expect(res).toMatchObject({
      success: false,
      error: "TEACHER_OVER_CAP",
      details: "30/25",
    })
  })
})

describe("unassignTeacher", () => {
  it("refuses sections that are not this school's", async () => {
    as("ADMIN")
    vi.mocked(db.section.count).mockResolvedValue(1)
    const res = await unassignTeacher({
      subjectId: "math",
      sectionIds: ["7A", "foreign"],
    })
    expect(res).toMatchObject({ success: false, error: "INVALID_SECTION" })
    expect(unassignPairs).not.toHaveBeenCalled()
  })
})

describe("saveTeacherSubjects", () => {
  it("unassigns dropped pairs and assigns new ones, grouped by subject", async () => {
    as("ADMIN")
    vi.mocked(db.subjectTeacher.findMany).mockResolvedValue([
      { sectionId: "7A", subjectId: "math" },
      { sectionId: "7B", subjectId: "math" },
    ] as never)

    const res = await saveTeacherSubjects({
      teacherId: "t1",
      pairs: [
        { sectionId: "7A", subjectId: "math" },
        { sectionId: "7A", subjectId: "english" },
        { sectionId: "7B", subjectId: "english" },
      ],
    })

    expect(res.success).toBe(true)
    expect(unassignPairs).toHaveBeenCalledWith({
      schoolId: SCHOOL,
      termId: TERM,
      subjectId: "math",
      sectionIds: ["7B"],
    })
    expect(applyAssignment).toHaveBeenCalledTimes(1)
    expect(applyAssignment).toHaveBeenCalledWith(
      expect.objectContaining({
        subjectId: "english",
        sectionIds: ["7A", "7B"],
        respectCap: false,
      })
    )
  })

  it("checks the weekly cap for the whole edit before writing", async () => {
    as("ADMIN")
    vi.mocked(db.subjectTeacher.findMany).mockResolvedValue([])
    vi.mocked(db.timetable.count).mockResolvedValue(20)
    vi.mocked(db.timetable.findMany).mockResolvedValue(
      Array.from({ length: 10 }, () => ({
        sectionId: "8A",
        subjectId: "arabic",
        teacherId: null,
      })) as never
    )

    const res = await saveTeacherSubjects({
      teacherId: "t1",
      pairs: [{ sectionId: "8A", subjectId: "arabic" }],
    })

    expect(res).toMatchObject({
      success: false,
      error: "TEACHER_OVER_CAP",
      details: "30/25",
    })
    expect(unassignPairs).not.toHaveBeenCalled()
    expect(applyAssignment).not.toHaveBeenCalled()
  })

  it("refuses a teacher of another school", async () => {
    as("ADMIN")
    vi.mocked(db.teacher.findFirst).mockResolvedValue(null)
    const res = await saveTeacherSubjects({ teacherId: "x", pairs: [] })
    expect(res).toMatchObject({ success: false, error: "TEACHER_NOT_FOUND" })
  })
})

describe("saveTeacherSubjects — specialties", () => {
  beforeEach(() => {
    as("ADMIN")
    vi.mocked(db.subjectTeacher.findMany).mockResolvedValue([])
  })

  it("makes the teacher's specialties exactly the list plus assigned subjects", async () => {
    vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
      { catalogSubjectId: "math-g1" },
      { catalogSubjectId: "math-g2" },
    ] as never)
    vi.mocked(db.teacherSubjectExpertise.findMany)
      .mockResolvedValueOnce([] as never) // validation: held
      .mockResolvedValueOnce([
        { subjectId: "math-g1" },
        { subjectId: "art-g1" },
      ] as never) // sync: current

    const res = await saveTeacherSubjects({
      teacherId: "t1",
      pairs: [],
      specialtyIds: ["math-g1", "math-g2"],
    })

    expect(res.success).toBe(true)
    expect(db.teacherSubjectExpertise.deleteMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL,
        teacherId: "t1",
        subjectId: { in: ["art-g1"] },
      },
    })
    expect(db.teacherSubjectExpertise.createMany).toHaveBeenCalledWith({
      data: [
        {
          schoolId: SCHOOL,
          teacherId: "t1",
          subjectId: "math-g2",
          expertiseLevel: "PRIMARY",
        },
      ],
      skipDuplicates: true,
    })
    expect(applyAssignment).not.toHaveBeenCalled()
  })

  it("refuses a specialty the school doesn't teach, before any write", async () => {
    vi.mocked(db.subjectSelection.findMany).mockResolvedValue([] as never)
    vi.mocked(db.teacherSubjectExpertise.findMany).mockResolvedValue(
      [] as never
    )

    const res = await saveTeacherSubjects({
      teacherId: "t1",
      pairs: [{ sectionId: "7A", subjectId: "math-g7" }],
      specialtyIds: ["other-school-subject"],
    })

    expect(res).toMatchObject({ success: false, error: "VALIDATION_ERROR" })
    expect(applyAssignment).not.toHaveBeenCalled()
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("leaves specialties alone when the list is omitted", async () => {
    const res = await saveTeacherSubjects({ teacherId: "t1", pairs: [] })
    expect(res.success).toBe(true)
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
