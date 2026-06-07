// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  bulkEnrollStudentsInClasses,
  generateClassesForGrade,
  generateSections,
} from "@/components/school-dashboard/listings/classrooms/configure/actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    academicGrade: { findFirst: vi.fn() },
    section: { count: vi.fn(), findMany: vi.fn(), create: vi.fn() },
    classroom: {
      upsert: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    classroomType: { findFirst: vi.fn(), create: vi.fn() },
    school: { findUnique: vi.fn() },
    term: { findFirst: vi.fn() },
    teacher: { findMany: vi.fn() },
    teacherSubjectExpertise: { findMany: vi.fn() },
    period: { findMany: vi.fn() },
    subjectSelection: { findMany: vi.fn() },
    class: { findMany: vi.fn(), createMany: vi.fn() },
    department: { findFirst: vi.fn(), create: vi.fn() },
    student: { findMany: vi.fn() },
    studentClass: { createMany: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => {
      // Default: invoke the callback with a tx proxying to db
      return cb(db as unknown)
    }),
  },
}))

const SCHOOL = "school-1"

function asAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", role: "ADMIN", schoolId: SCHOOL },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL,
    subdomain: "demo",
    role: "ADMIN",
    locale: "en",
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  asAdmin()
})

// ============================================================================
// generateSections — happy path + idempotency
// ============================================================================

describe("generateSections (additional cases)", () => {
  it("creates only the missing sections when some letters are already in use", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue({
      maxClasses: null, // no limit
    } as any)
    vi.mocked(db.classroom.count).mockResolvedValue(1)
    vi.mocked(db.section.count).mockResolvedValue(1)
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
      gradeNumber: 1,
    } as any)
    // 1 of 3 sections already exists (letter A)
    vi.mocked(db.section.findMany).mockResolvedValue([{ letter: "A" }] as any)
    vi.mocked(db.classroom.upsert).mockImplementation(
      async ({ create }) =>
        ({
          id: `room-${(create as any).roomName}`,
          capacity: (create as any).capacity,
        }) as any
    )
    vi.mocked(db.section.create).mockResolvedValue({} as any)

    const result = await generateSections({
      grades: [
        { gradeId: "g1", sections: 3, capacityPerSection: 30, roomType: "rt1" },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.created).toBe(2) // only B and C
      expect(result.data.details[0]).toMatch(/Grade 1: created 2 new sections/)
    }
    expect(vi.mocked(db.section.create)).toHaveBeenCalledTimes(2)
  })

  it("skips a grade entirely when it already has enough sections", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue({
      maxClasses: null,
    } as any)
    vi.mocked(db.classroom.count).mockResolvedValue(0)
    vi.mocked(db.section.count).mockResolvedValue(3)
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
      gradeNumber: 1,
    } as any)
    vi.mocked(db.section.findMany).mockResolvedValue([
      { letter: "A" },
      { letter: "B" },
      { letter: "C" },
    ] as any)

    const result = await generateSections({
      grades: [
        { gradeId: "g1", sections: 3, capacityPerSection: 30, roomType: "rt1" },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.created).toBe(0)
      expect(result.data.details[0]).toMatch(/already has 3 sections/)
    }
    expect(vi.mocked(db.section.create)).not.toHaveBeenCalled()
  })

  it("aborts the transaction when section capacity exceeds the existing room capacity", async () => {
    vi.mocked(db.school.findUnique).mockResolvedValue({
      maxClasses: null,
    } as any)
    vi.mocked(db.classroom.count).mockResolvedValue(0)
    vi.mocked(db.section.count).mockResolvedValue(0)
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
      gradeNumber: 1,
    } as any)
    vi.mocked(db.section.findMany).mockResolvedValue([] as any)
    // Existing room has lower capacity than requested
    vi.mocked(db.classroom.upsert).mockResolvedValue({
      id: "room-existing",
      capacity: 20,
    } as any)

    const result = await generateSections({
      grades: [
        { gradeId: "g1", sections: 1, capacityPerSection: 30, roomType: "rt1" },
      ],
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe("CAPACITY_EXCEEDS_ROOM")
      // Structured details so the client can build a translated message.
      const details = JSON.parse((result as any).details ?? "{}")
      expect(details).toMatchObject({
        sectionCapacity: 30,
        roomCapacity: 20,
      })
    }
    expect(vi.mocked(db.section.create)).not.toHaveBeenCalled()
  })
})

// ============================================================================
// generateClassesForGrade
// ============================================================================

describe("generateClassesForGrade", () => {
  it("returns NOT_AUTHENTICATED without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await generateClassesForGrade({
      gradeIds: ["g1"],
      termId: "t1",
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns MISSING_SCHOOL without tenant context", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "demo",
      role: "ADMIN",
      locale: "en",
    })
    const result = await generateClassesForGrade({
      gradeIds: ["g1"],
      termId: "t1",
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
  })

  it("returns UNAUTHORIZED for read-only roles", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "TEACHER", schoolId: SCHOOL },
    } as any)
    const result = await generateClassesForGrade({
      gradeIds: ["g1"],
      termId: "t1",
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
  })

  it("returns NOT_FOUND when the term does not belong to the school", async () => {
    vi.mocked(db.term.findFirst).mockResolvedValue(null)
    const result = await generateClassesForGrade({
      gradeIds: ["g1"],
      termId: "t-nope",
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_FOUND")
  })

  it("errors when the school has zero teachers (cannot assign)", async () => {
    vi.mocked(db.term.findFirst).mockResolvedValue({ id: "t1" } as any)
    vi.mocked(db.teacher.findMany).mockResolvedValue([] as any)
    vi.mocked(db.teacherSubjectExpertise.findMany).mockResolvedValue([] as any)
    vi.mocked(db.period.findMany).mockResolvedValue([
      { id: "p1" },
      { id: "p2" },
    ] as any)

    const result = await generateClassesForGrade({
      gradeIds: ["g1"],
      termId: "t1",
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NO_TEACHERS_FOUND")
  })

  it("errors when there are fewer than 2 periods configured", async () => {
    vi.mocked(db.term.findFirst).mockResolvedValue({ id: "t1" } as any)
    vi.mocked(db.teacher.findMany).mockResolvedValue([{ id: "tch1" }] as any)
    vi.mocked(db.teacherSubjectExpertise.findMany).mockResolvedValue([] as any)
    vi.mocked(db.period.findMany).mockResolvedValue([{ id: "p1" }] as any)

    const result = await generateClassesForGrade({
      gradeIds: ["g1"],
      termId: "t1",
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NO_PERIODS_FOUND")
  })

  it("creates classes for each subject selection, reusing the default classroom when none exists", async () => {
    vi.mocked(db.term.findFirst).mockResolvedValue({ id: "t1" } as any)
    vi.mocked(db.teacher.findMany).mockResolvedValue([{ id: "tch1" }] as any)
    vi.mocked(db.teacherSubjectExpertise.findMany).mockResolvedValue([
      { subjectId: "sub1", teacherId: "tch1" },
    ] as any)
    vi.mocked(db.period.findMany).mockResolvedValue([
      { id: "p1" },
      { id: "p2" },
    ] as any)
    vi.mocked(db.department.findFirst).mockResolvedValue({ id: "d1" } as any)

    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      id: "g1",
      name: "Grade 1",
      gradeNumber: 1,
    } as any)
    vi.mocked(db.subjectSelection.findMany).mockResolvedValue([
      {
        catalogSubjectId: "sub1",
        subject: { id: "sub1", name: "Math" },
        customName: null,
      },
    ] as any)
    vi.mocked(db.class.findMany).mockResolvedValue([] as any)
    // No grade-specific classroom exists yet -> default-room creation path
    vi.mocked(db.classroom.findMany).mockResolvedValue([] as any)
    vi.mocked(db.classroomType.findFirst).mockResolvedValue({
      id: "ct1",
    } as any)
    vi.mocked(db.classroom.upsert).mockResolvedValue({
      id: "default-room",
    } as any)
    vi.mocked(db.class.createMany).mockResolvedValue({ count: 1 } as any)

    const result = await generateClassesForGrade({
      gradeIds: ["g1"],
      termId: "t1",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.created).toBe(1)
      expect(result.data.details[0]).toMatch(/Grade 1: created 1 class/)
    }
    expect(vi.mocked(db.class.createMany)).toHaveBeenCalledTimes(1)
    const createCall = vi.mocked(db.class.createMany).mock.calls[0][0] as any
    expect(createCall.data[0]).toMatchObject({
      schoolId: SCHOOL,
      subjectId: "sub1",
      gradeId: "g1",
      teacherId: "tch1",
      classroomId: "default-room",
    })
  })

  it("notes when a grade has no active subject selections", async () => {
    vi.mocked(db.term.findFirst).mockResolvedValue({ id: "t1" } as any)
    vi.mocked(db.teacher.findMany).mockResolvedValue([{ id: "tch1" }] as any)
    vi.mocked(db.teacherSubjectExpertise.findMany).mockResolvedValue([] as any)
    vi.mocked(db.period.findMany).mockResolvedValue([
      { id: "p1" },
      { id: "p2" },
    ] as any)
    vi.mocked(db.department.findFirst).mockResolvedValue({ id: "d1" } as any)
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      id: "g1",
      name: "Grade 1",
      gradeNumber: 1,
    } as any)
    vi.mocked(db.subjectSelection.findMany).mockResolvedValue([] as any)

    const result = await generateClassesForGrade({
      gradeIds: ["g1"],
      termId: "t1",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.created).toBe(0)
      expect(result.data.details[0]).toMatch(/no active subject selections/)
    }
  })
})

// ============================================================================
// bulkEnrollStudentsInClasses
// ============================================================================

describe("bulkEnrollStudentsInClasses", () => {
  it("returns NOT_AUTHENTICATED without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as any)
    const result = await bulkEnrollStudentsInClasses({ gradeIds: ["g1"] })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns MISSING_SCHOOL without tenant context", async () => {
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: null as any,
      subdomain: "demo",
      role: "ADMIN",
      locale: "en",
    })
    const result = await bulkEnrollStudentsInClasses({ gradeIds: ["g1"] })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
  })

  it("returns UNAUTHORIZED for read-only roles", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "u1", role: "TEACHER", schoolId: SCHOOL },
    } as any)
    const result = await bulkEnrollStudentsInClasses({ gradeIds: ["g1"] })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
  })

  it("returns VALIDATION_ERROR when the input fails Zod validation", async () => {
    const result = await bulkEnrollStudentsInClasses({ gradeIds: [] } as any)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
  })

  it("notes 'no students' when a grade has none enrolled", async () => {
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
    } as any)
    vi.mocked(db.student.findMany).mockResolvedValue([] as any)
    vi.mocked(db.class.findMany).mockResolvedValue([{ id: "c1" }] as any)

    const result = await bulkEnrollStudentsInClasses({ gradeIds: ["g1"] })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.enrolled).toBe(0)
      expect(result.data.details[0]).toMatch(/no students assigned/)
    }
    expect(vi.mocked(db.studentClass.createMany)).not.toHaveBeenCalled()
  })

  it("notes 'no classes' when a grade has students but no classes generated", async () => {
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
    } as any)
    vi.mocked(db.student.findMany).mockResolvedValue([{ id: "s1" }] as any)
    vi.mocked(db.class.findMany).mockResolvedValue([] as any)

    const result = await bulkEnrollStudentsInClasses({ gradeIds: ["g1"] })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.enrolled).toBe(0)
      expect(result.data.details[0]).toMatch(/generate classes first/)
    }
    expect(vi.mocked(db.studentClass.createMany)).not.toHaveBeenCalled()
  })

  it("creates one student×class pair per combination and counts enrollments", async () => {
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      name: "Grade 1",
    } as any)
    vi.mocked(db.student.findMany).mockResolvedValue([
      { id: "s1" },
      { id: "s2" },
    ] as any)
    vi.mocked(db.class.findMany).mockResolvedValue([
      { id: "c1" },
      { id: "c2" },
    ] as any)
    vi.mocked(db.studentClass.createMany).mockResolvedValue({ count: 4 } as any)

    const result = await bulkEnrollStudentsInClasses({ gradeIds: ["g1"] })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.enrolled).toBe(4)
      expect(result.data.details[0]).toMatch(
        /2 students × 2 classes = 4 enrollments/
      )
    }
    const createCall = vi.mocked(db.studentClass.createMany).mock
      .calls[0][0] as any
    expect(createCall.data).toHaveLength(4)
    expect(createCall.skipDuplicates).toBe(true)
    expect(createCall.data[0]).toMatchObject({
      schoolId: SCHOOL,
      studentId: "s1",
      classId: "c1",
    })
  })
})
