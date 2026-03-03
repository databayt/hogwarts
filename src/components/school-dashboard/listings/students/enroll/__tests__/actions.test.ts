// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { enrollStudent } from "../actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    academicGrade: {
      findFirst: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
    },
    studentYearLevel: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
    studentClass: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    studentBatch: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"
const USER_ID = "user-1"

function mockAdmin() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "ADMIN" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "test-school",
    role: "ADMIN",
    locale: "en",
  })
}

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null as any)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("enrollStudent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdmin()
  })

  it("enrolls student with academic grade using schoolId-scoped updateMany", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "student-1",
    } as any)
    vi.mocked(db.student.updateMany).mockResolvedValue({ count: 1 })
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      id: "grade-5",
      yearLevelId: null,
    } as any)

    const result = await enrollStudent({
      studentId: "student-1",
      academicGradeId: "grade-5",
    })

    expect(result.success).toBe(true)
    expect(result.data?.studentId).toBe("student-1")
    // Verify updateMany is used with schoolId (not update with just id)
    expect(db.student.updateMany).toHaveBeenCalledWith({
      where: { id: "student-1", schoolId: SCHOOL_ID },
      data: { academicGradeId: "grade-5" },
    })
  })

  it("creates StudentYearLevel for backward compatibility", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "student-1",
    } as any)
    vi.mocked(db.student.updateMany).mockResolvedValue({ count: 1 })
    vi.mocked(db.academicGrade.findFirst).mockResolvedValue({
      id: "grade-5",
      yearLevelId: "yl-5",
    } as any)
    vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
      id: "sy-2026",
    } as any)
    vi.mocked(db.studentYearLevel.findFirst).mockResolvedValue(null)
    vi.mocked(db.studentYearLevel.create).mockResolvedValue({} as any)

    const result = await enrollStudent({
      studentId: "student-1",
      academicGradeId: "grade-5",
    })

    expect(result.success).toBe(true)
    expect(db.studentYearLevel.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_ID,
        studentId: "student-1",
        levelId: "yl-5",
        yearId: "sy-2026",
      },
    })
  })

  it("assigns student to class with capacity check", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "student-1",
    } as any)
    vi.mocked(db.class.findFirst).mockResolvedValue({
      maxCapacity: 30,
      _count: { studentClasses: 20 },
    } as any)
    vi.mocked(db.studentClass.findFirst).mockResolvedValue(null)
    vi.mocked(db.studentClass.create).mockResolvedValue({} as any)

    const result = await enrollStudent({
      studentId: "student-1",
      classId: "class-1",
    })

    expect(result.success).toBe(true)
    expect(db.studentClass.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_ID,
        studentId: "student-1",
        classId: "class-1",
      },
    })
  })

  it("rejects enrollment when class is at capacity", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "student-1",
    } as any)
    vi.mocked(db.class.findFirst).mockResolvedValue({
      maxCapacity: 30,
      _count: { studentClasses: 30 },
    } as any)

    const result = await enrollStudent({
      studentId: "student-1",
      classId: "class-1",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Class is at full capacity")
  })

  it("skips duplicate class enrollment", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "student-1",
    } as any)
    vi.mocked(db.class.findFirst).mockResolvedValue({
      maxCapacity: 30,
      _count: { studentClasses: 20 },
    } as any)
    vi.mocked(db.studentClass.findFirst).mockResolvedValue({
      id: "existing",
    } as any)

    const result = await enrollStudent({
      studentId: "student-1",
      classId: "class-1",
    })

    expect(result.success).toBe(true)
    // Should not create duplicate
    expect(db.studentClass.create).not.toHaveBeenCalled()
  })

  it("assigns student to batch", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "student-1",
    } as any)
    vi.mocked(db.studentBatch.findFirst).mockResolvedValue(null)
    vi.mocked(db.studentBatch.create).mockResolvedValue({} as any)

    const result = await enrollStudent({
      studentId: "student-1",
      batchId: "batch-1",
    })

    expect(result.success).toBe(true)
    expect(db.studentBatch.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: SCHOOL_ID,
        studentId: "student-1",
        batchId: "batch-1",
        isActive: true,
      }),
    })
  })

  it("returns error when not authenticated", async () => {
    mockUnauthenticated()

    const result = await enrollStudent({
      studentId: "student-1",
      academicGradeId: "grade-5",
    })

    expect(result.success).toBe(false)
  })

  it("returns error when student not found in school", async () => {
    vi.mocked(db.student.findFirst).mockResolvedValue(null)

    const result = await enrollStudent({
      studentId: "student-from-other-school",
      academicGradeId: "grade-5",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("Student not found")
  })
})
