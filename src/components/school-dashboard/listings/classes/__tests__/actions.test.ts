// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createClass,
  deleteClass,
  enrollStudentInClass,
  getClasses,
  getClassesExportData,
  updateClass,
} from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/enrollment-sync", () => ({
  syncStudentClassToEnrollment: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/prisma-guards", () => ({
  getModelOrThrow: vi.fn((name: string) => {
    const models: Record<string, any> = {
      student: db.student,
      studentClass: db.studentClass,
      teacher: db.teacher,
      classTeacher: db.classTeacher,
    }
    return models[name]
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    class: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      deleteMany: vi.fn(),
      updateMany: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    classroom: {
      findFirst: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    studentClass: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    teacher: {
      findMany: vi.fn(),
    },
    classTeacher: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

// ============================================================================
// Helpers
// ============================================================================

const ADMIN_SESSION = {
  user: { id: "admin-1", role: "ADMIN", schoolId: "school-1" },
}

const TEACHER_SESSION = {
  user: { id: "teacher-1", role: "TEACHER", schoolId: "school-1" },
}

const STUDENT_SESSION = {
  user: { id: "student-1", role: "STUDENT", schoolId: "school-1" },
}

const SCHOOL_CONTEXT = { schoolId: "school-1" }

function setupAuth(session: any = ADMIN_SESSION) {
  vi.mocked(auth).mockResolvedValue(session)
  vi.mocked(getTenantContext).mockResolvedValue(SCHOOL_CONTEXT as any)
}

const VALID_CREATE_INPUT = {
  name: "Math 101 - Section A",
  subjectId: "subj-1",
  teacherId: "teacher-1",
  termId: "term-1",
  startPeriodId: "period-1",
  endPeriodId: "period-5",
  classroomId: "room-1",
  evaluationType: "NORMAL" as const,
}

// ============================================================================
// Tests
// ============================================================================

describe("Class Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createClass
  // ==========================================================================

  describe("createClass", () => {
    it("creates class with schoolId for multi-tenant isolation", async () => {
      setupAuth()
      vi.mocked(db.class.count).mockResolvedValue(0)
      vi.mocked(db.school.findFirst).mockResolvedValue({
        maxClasses: 100,
      } as any)
      vi.mocked(db.classroom.findFirst).mockResolvedValue({
        capacity: 40,
        roomName: "Room 1",
      } as any)
      vi.mocked(db.class.create).mockResolvedValue({
        id: "class-1",
      } as any)

      const result = await createClass(VALID_CREATE_INPUT)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe("class-1")
      }
      expect(db.class.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: "school-1",
          name: "Math 101 - Section A",
          subjectId: "subj-1",
        }),
      })
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      vi.mocked(getTenantContext).mockResolvedValue(SCHOOL_CONTEXT as any)

      const result = await createClass(VALID_CREATE_INPUT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe(ACTION_ERRORS.NOT_AUTHENTICATED)
      }
    })

    it("returns error when missing school context", async () => {
      vi.mocked(auth).mockResolvedValue(ADMIN_SESSION as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
      } as any)

      const result = await createClass(VALID_CREATE_INPUT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe(ACTION_ERRORS.MISSING_SCHOOL)
      }
    })

    it("enforces plan limit", async () => {
      setupAuth()
      vi.mocked(db.class.count).mockResolvedValue(50)
      vi.mocked(db.school.findFirst).mockResolvedValue({
        maxClasses: 50,
      } as any)

      const result = await createClass(VALID_CREATE_INPUT)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("limit reached")
      }
      expect(db.class.create).not.toHaveBeenCalled()
    })

    it("requires ADMIN or DEVELOPER role (rejects STUDENT)", async () => {
      setupAuth(STUDENT_SESSION)

      const result = await createClass(VALID_CREATE_INPUT)

      expect(result.success).toBe(false)
      expect(db.class.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // updateClass
  // ==========================================================================

  describe("updateClass", () => {
    it("updates class with schoolId scope", async () => {
      setupAuth()
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "class-1",
      } as any)
      vi.mocked(db.class.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await updateClass({
        id: "class-1",
        name: "Updated Name",
      })

      expect(result.success).toBe(true)
      expect(db.class.updateMany).toHaveBeenCalledWith({
        where: { id: "class-1", schoolId: "school-1" },
        data: expect.objectContaining({ name: "Updated Name" }),
      })
    })

    it("prevents updating class from different school", async () => {
      setupAuth()
      vi.mocked(db.class.findFirst).mockResolvedValue(null)

      const result = await updateClass({
        id: "class-other-school",
        name: "Hacked",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Class not found")
      }
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      setupAuth(STUDENT_SESSION)

      const result = await updateClass({
        id: "class-1",
        name: "Updated",
      })

      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // deleteClass
  // ==========================================================================

  describe("deleteClass", () => {
    it("deletes class with schoolId scope", async () => {
      setupAuth()
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "class-1",
      } as any)
      vi.mocked(db.class.deleteMany).mockResolvedValue({ count: 1 } as any)

      const result = await deleteClass({ id: "class-1" })

      expect(result.success).toBe(true)
      expect(db.class.deleteMany).toHaveBeenCalledWith({
        where: { id: "class-1", schoolId: "school-1" },
      })
    })

    it("prevents deleting class from different school", async () => {
      setupAuth()
      vi.mocked(db.class.findFirst).mockResolvedValue(null)

      const result = await deleteClass({ id: "class-other-school" })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Class not found")
      }
    })
  })

  // ==========================================================================
  // getClasses
  // ==========================================================================

  describe("getClasses", () => {
    it("fetches classes scoped to schoolId", async () => {
      setupAuth()
      const mockRows = [
        {
          id: "c1",
          name: "Math A",
          subject: { subjectName: "Math" },
          teacher: { givenName: "John", surname: "Smith" },
          term: { termNumber: 1 },
          grade: { name: "Grade 1", gradeNumber: 1 },
          courseCode: "MATH101",
          credits: 3,
          evaluationType: "NORMAL",
          maxCapacity: 30,
          createdAt: new Date("2026-01-01"),
          _count: { studentClasses: 15 },
        },
      ]
      vi.mocked(db.class.findMany).mockResolvedValue(mockRows as any)
      vi.mocked(db.class.count).mockResolvedValue(1)

      const result = await getClasses({})

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.rows).toHaveLength(1)
        expect(result.data?.total).toBe(1)
      }
      expect(db.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: "school-1" }),
        })
      )
    })

    it("applies filters with schoolId", async () => {
      setupAuth()
      vi.mocked(db.class.findMany).mockResolvedValue([] as any)
      vi.mocked(db.class.count).mockResolvedValue(0)

      await getClasses({ subjectId: "subj-1", termId: "term-1" })

      expect(db.class.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: "school-1",
            subjectId: "subj-1",
            termId: "term-1",
          }),
        })
      )
    })
  })

  // ==========================================================================
  // enrollStudentInClass
  // ==========================================================================

  describe("enrollStudentInClass", () => {
    it("enrolls student with capacity validation", async () => {
      setupAuth()
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "class-1",
        name: "Math A",
        maxCapacity: 30,
        _count: { studentClasses: 10 },
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
        givenName: "Ali",
        surname: "Hassan",
      } as any)
      vi.mocked(db.studentClass.findFirst).mockResolvedValue(null)
      vi.mocked(db.studentClass.create).mockResolvedValue({} as any)

      const result = await enrollStudentInClass({
        classId: "class-1",
        studentId: "student-1",
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.currentEnrollment).toBe(11)
        expect(result.data?.remainingSpots).toBe(19)
      }
    })

    it("rejects enrollment when at capacity", async () => {
      setupAuth()
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "class-1",
        name: "Math A",
        maxCapacity: 30,
        _count: { studentClasses: 30 },
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
        givenName: "Ali",
        surname: "Hassan",
      } as any)
      vi.mocked(db.studentClass.findFirst).mockResolvedValue(null)

      const result = await enrollStudentInClass({
        classId: "class-1",
        studentId: "student-1",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("full capacity")
      }
      expect(db.studentClass.create).not.toHaveBeenCalled()
    })

    it("rejects duplicate enrollment", async () => {
      setupAuth()
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: "class-1",
        name: "Math A",
        maxCapacity: 30,
        _count: { studentClasses: 10 },
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
        givenName: "Ali",
        surname: "Hassan",
      } as any)
      vi.mocked(db.studentClass.findFirst).mockResolvedValue({
        id: "existing",
      } as any)

      const result = await enrollStudentInClass({
        classId: "class-1",
        studentId: "student-1",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("already enrolled")
      }
    })
  })

  // ==========================================================================
  // getClassesExportData
  // ==========================================================================

  describe("getClassesExportData", () => {
    it("returns export data without phantom fields", async () => {
      setupAuth()
      vi.mocked(db.class.findMany).mockResolvedValue([
        {
          id: "c1",
          name: "Math A",
          courseCode: "MATH101",
          maxCapacity: 30,
          createdAt: new Date("2026-01-01"),
          subject: { subjectName: "Math" },
          teacher: { givenName: "John", surname: "Smith" },
          term: { termNumber: 1 },
          classroom: { roomName: "Room 101", capacity: 40 },
          _count: { studentClasses: 15 },
        },
      ] as any)

      const result = await getClassesExportData()

      expect(result.success).toBe(true)
      if (result.success && result.data) {
        const row = result.data[0] as any
        expect(row.code).toBe("MATH101")
        expect(row.room).toBe("Room 101")
        expect(row.studentCount).toBe(15)
        // Verify phantom fields are removed
        expect(row).not.toHaveProperty("description")
        expect(row).not.toHaveProperty("schedule")
        expect(row).not.toHaveProperty("isActive")
        expect(row).not.toHaveProperty("yearLevelName")
      }
    })
  })
})
