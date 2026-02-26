// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Integration tests for attendance actions against a real database.
 *
 * Verifies:
 * 1. Compound unique constraint (schoolId + studentId + classId + date + periodId)
 * 2. Soft-delete / restore behaviour
 * 3. Multi-tenant isolation
 *
 * Run with: pnpm vitest --config vitest.config.integration.mts --run
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest"

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import "@/test/integration/setup"

import { cleanupTestData, createTestSchool } from "@/test/integration/helpers"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  deleteAttendance,
  getAttendanceList,
  markAttendance,
  restoreAttendance,
} from "../actions/core"

// ---------------------------------------------------------------------------
// Mocks -- keep above action imports so vi.mock hoisting works correctly
// ---------------------------------------------------------------------------

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "test-user-id", role: "ADMIN", schoolId: "will-be-overridden" },
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock("server-only", () => ({}))

// Mock SMS notifications so they don't fire in tests
vi.mock("@/lib/notifications/sms", () => ({
  isChannelAvailable: vi.fn().mockReturnValue(false),
  sendAttendanceSMS: vi.fn().mockResolvedValue(undefined),
}))

// ---------------------------------------------------------------------------
// Shared state for the entire file
// ---------------------------------------------------------------------------

// School A
let schoolA: { id: string }
let classA: { id: string }
let studentA: { id: string }

// School B (for isolation tests)
let schoolB: { id: string }
let classB: { id: string }
let studentB: { id: string }

// Shared test date -- midnight UTC so @db.Date comparisons are stable
const TEST_DATE = "2026-01-15"
const TEST_DATE_OBJ = new Date("2026-01-15T00:00:00.000Z")

// ---------------------------------------------------------------------------
// Helpers to build the full dependency chain for a Class record
// ---------------------------------------------------------------------------

async function createFullClassChain(schoolId: string, suffix: string) {
  const department = await db.department.create({
    data: { schoolId, departmentName: `Dept ${suffix}` },
  })

  const subject = await db.subject.create({
    data: {
      schoolId,
      departmentId: department.id,
      subjectName: `Subject ${suffix}`,
    },
  })

  const teacher = await db.teacher.create({
    data: {
      schoolId,
      givenName: `Teacher`,
      surname: suffix,
      emailAddress: `teacher-${suffix}@test-integration.com`,
    },
  })

  const schoolYear = await db.schoolYear.create({
    data: {
      schoolId,
      yearName: `2025-${suffix}`,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-06-30"),
    },
  })

  const term = await db.term.create({
    data: {
      schoolId,
      yearId: schoolYear.id,
      termNumber: 1,
      startDate: new Date("2025-09-01"),
      endDate: new Date("2026-01-31"),
    },
  })

  const startPeriod = await db.period.create({
    data: {
      schoolId,
      yearId: schoolYear.id,
      name: `P1 ${suffix}`,
      startTime: new Date("1970-01-01T08:00:00Z"),
      endTime: new Date("1970-01-01T08:45:00Z"),
    },
  })

  const endPeriod = await db.period.create({
    data: {
      schoolId,
      yearId: schoolYear.id,
      name: `P2 ${suffix}`,
      startTime: new Date("1970-01-01T08:45:00Z"),
      endTime: new Date("1970-01-01T09:30:00Z"),
    },
  })

  const classroomType = await db.classroomType.create({
    data: { schoolId, name: `Room Type ${suffix}` },
  })

  const classroom = await db.classroom.create({
    data: {
      schoolId,
      typeId: classroomType.id,
      roomName: `Room ${suffix}`,
      capacity: 30,
    },
  })

  const cls = await db.class.create({
    data: {
      schoolId,
      subjectId: subject.id,
      teacherId: teacher.id,
      termId: term.id,
      startPeriodId: startPeriod.id,
      endPeriodId: endPeriod.id,
      classroomId: classroom.id,
      name: `Class ${suffix}`,
    },
  })

  return cls
}

async function createStudentWithEnrollment(
  schoolId: string,
  classId: string,
  suffix: string
) {
  const student = await db.student.create({
    data: {
      schoolId,
      givenName: `Student`,
      surname: suffix,
      dateOfBirth: new Date("2010-01-01"),
      gender: "M",
    },
  })

  await db.studentClass.create({
    data: { schoolId, studentId: student.id, classId },
  })

  return student
}

/**
 * Deep cleanup that removes all records we created for a school,
 * in the correct order to respect foreign-key constraints.
 */
async function deepCleanup(schoolId: string) {
  // Order matters: delete leaf tables first, then parents
  await db.studentClass.deleteMany({ where: { schoolId } })
  await db.notification.deleteMany({ where: { schoolId } })
  await db.attendance.deleteMany({ where: { schoolId } })
  await db.student.deleteMany({ where: { schoolId } })
  await db.class.deleteMany({ where: { schoolId } })
  await db.classroom.deleteMany({ where: { schoolId } })
  await db.classroomType.deleteMany({ where: { schoolId } })
  await db.period.deleteMany({ where: { schoolId } })
  await db.term.deleteMany({ where: { schoolId } })
  await db.schoolYear.deleteMany({ where: { schoolId } })
  await db.subject.deleteMany({ where: { schoolId } })
  await db.department.deleteMany({ where: { schoolId } })
  await db.teacher.deleteMany({ where: { schoolId } })
  await db.absenceIntention.deleteMany({ where: { schoolId } })
  await db.school.delete({ where: { id: schoolId } }).catch(() => {
    // Ignore if already deleted
  })
}

// ---------------------------------------------------------------------------
// Helpers to switch tenant context
// ---------------------------------------------------------------------------

function switchTenant(schoolId: string) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role: "ADMIN",
    isPlatformAdmin: false,
  })
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  // Create two independent schools with their full dependency chains
  schoolA = await createTestSchool({ name: "Integration School A" })
  classA = await createFullClassChain(schoolA.id, "a")
  studentA = await createStudentWithEnrollment(schoolA.id, classA.id, "a")

  schoolB = await createTestSchool({ name: "Integration School B" })
  classB = await createFullClassChain(schoolB.id, "b")
  studentB = await createStudentWithEnrollment(schoolB.id, classB.id, "b")
}, 60_000) // generous timeout for DB setup

afterAll(async () => {
  await deepCleanup(schoolA.id)
  await deepCleanup(schoolB.id)
}, 30_000)

beforeEach(() => {
  vi.clearAllMocks()
  // Default to School A
  switchTenant(schoolA.id)
})

// ===========================================================================
// 1. Compound unique constraint
// ===========================================================================

describe("Compound unique constraint", () => {
  afterAll(async () => {
    // Clean up attendance records created in this block
    await db.attendance.deleteMany({
      where: { schoolId: schoolA.id, classId: classA.id, date: TEST_DATE_OBJ },
    })
  })

  it("creates a new attendance record when none exists", async () => {
    const result = await markAttendance({
      classId: classA.id,
      date: TEST_DATE,
      records: [{ studentId: studentA.id, status: "present" }],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.count).toBe(1)
    }

    // Verify exactly one record in the database
    const rows = await db.attendance.findMany({
      where: {
        schoolId: schoolA.id,
        studentId: studentA.id,
        classId: classA.id,
        date: TEST_DATE_OBJ,
        periodId: null,
      },
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe("PRESENT")
  })

  it("updates existing record instead of creating a duplicate when called again for the same student/class/date", async () => {
    // Mark again with a different status
    const result = await markAttendance({
      classId: classA.id,
      date: TEST_DATE,
      records: [{ studentId: studentA.id, status: "absent" }],
    })

    expect(result.success).toBe(true)

    // Still exactly one record
    const rows = await db.attendance.findMany({
      where: {
        schoolId: schoolA.id,
        studentId: studentA.id,
        classId: classA.id,
        date: TEST_DATE_OBJ,
        periodId: null,
      },
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe("ABSENT")
  })

  it("handles rapid sequential calls without duplicating records", async () => {
    // Fire three sequential status changes
    await markAttendance({
      classId: classA.id,
      date: TEST_DATE,
      records: [{ studentId: studentA.id, status: "late" }],
    })
    await markAttendance({
      classId: classA.id,
      date: TEST_DATE,
      records: [{ studentId: studentA.id, status: "present" }],
    })
    await markAttendance({
      classId: classA.id,
      date: TEST_DATE,
      records: [{ studentId: studentA.id, status: "absent" }],
    })

    const rows = await db.attendance.findMany({
      where: {
        schoolId: schoolA.id,
        studentId: studentA.id,
        classId: classA.id,
        date: TEST_DATE_OBJ,
        periodId: null,
      },
    })

    expect(rows).toHaveLength(1)
    expect(rows[0].status).toBe("ABSENT")
  })
})

// ===========================================================================
// 2. Soft-delete behaviour
// ===========================================================================

describe("Soft-delete and restore", () => {
  let attendanceId: string

  beforeAll(async () => {
    switchTenant(schoolA.id)

    // Ensure clean slate for a different date
    const softDeleteDate = new Date("2026-02-10T00:00:00.000Z")
    await db.attendance.deleteMany({
      where: { schoolId: schoolA.id, classId: classA.id, date: softDeleteDate },
    })

    // Create an attendance record via the action
    await markAttendance({
      classId: classA.id,
      date: "2026-02-10",
      records: [{ studentId: studentA.id, status: "present" }],
    })

    const record = await db.attendance.findFirst({
      where: {
        schoolId: schoolA.id,
        studentId: studentA.id,
        classId: classA.id,
        date: softDeleteDate,
        periodId: null,
      },
    })

    attendanceId = record!.id
  })

  afterAll(async () => {
    await db.attendance.deleteMany({
      where: {
        schoolId: schoolA.id,
        classId: classA.id,
        date: new Date("2026-02-10T00:00:00.000Z"),
      },
    })
  })

  it("soft-deletes a record by setting deletedAt", async () => {
    switchTenant(schoolA.id)

    const result = await deleteAttendance(attendanceId)

    expect(result.success).toBe(true)
    expect(result.deletedAt).toBeDefined()

    // Verify the record still exists but has deletedAt
    const record = await db.attendance.findUnique({
      where: { id: attendanceId },
    })
    expect(record).not.toBeNull()
    expect(record!.deletedAt).not.toBeNull()
  })

  it("excludes soft-deleted records from getAttendanceList", async () => {
    switchTenant(schoolA.id)

    const result = await getAttendanceList({
      classId: classA.id,
      date: "2026-02-10",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      // The student should appear (because they're enrolled) but with the
      // default status "present" since their attendance record is soft-deleted
      // and excluded from the marks query.
      const row = result.data.rows.find((r) => r.studentId === studentA.id)
      expect(row).toBeDefined()
      // Since soft-deleted records are excluded from marks,
      // the student falls through to the default "present" status
      // (because getAttendanceList defaults unmarked students to "present")
      expect(row!.status).toBe("present")
      expect(row!.method).toBeUndefined()
    }
  })

  it("restores a soft-deleted record by clearing deletedAt", async () => {
    switchTenant(schoolA.id)

    const result = await restoreAttendance(attendanceId)
    expect(result.success).toBe(true)

    // Verify deletedAt is cleared
    const record = await db.attendance.findUnique({
      where: { id: attendanceId },
    })
    expect(record).not.toBeNull()
    expect(record!.deletedAt).toBeNull()
  })

  it("shows restored record in getAttendanceList", async () => {
    switchTenant(schoolA.id)

    const result = await getAttendanceList({
      classId: classA.id,
      date: "2026-02-10",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      const row = result.data.rows.find((r) => r.studentId === studentA.id)
      expect(row).toBeDefined()
      expect(row!.status).toBe("present")
      expect(row!.method).toBe("MANUAL")
    }
  })

  it("returns error when soft-deleting an already soft-deleted record", async () => {
    switchTenant(schoolA.id)

    // Soft delete first
    await deleteAttendance(attendanceId)

    // Try to soft delete again
    const result = await deleteAttendance(attendanceId)
    expect(result.success).toBe(false)
    expect(result.error).toBe("Attendance record not found")
  })

  it("returns error when restoring a non-soft-deleted record", async () => {
    switchTenant(schoolA.id)

    // Restore back first
    await restoreAttendance(attendanceId)

    // Try to restore when not deleted
    const result = await restoreAttendance(attendanceId)
    expect(result.success).toBe(false)
    expect(result.error).toBe("Deleted attendance record not found")
  })
})

// ===========================================================================
// 3. Multi-tenant isolation
// ===========================================================================

describe("Multi-tenant isolation", () => {
  let schoolAAttendanceId: string

  beforeAll(async () => {
    // Create attendance in School A
    switchTenant(schoolA.id)

    const isolationDate = new Date("2026-03-01T00:00:00.000Z")
    await db.attendance.deleteMany({
      where: { schoolId: schoolA.id, classId: classA.id, date: isolationDate },
    })
    await db.attendance.deleteMany({
      where: { schoolId: schoolB.id, classId: classB.id, date: isolationDate },
    })

    await markAttendance({
      classId: classA.id,
      date: "2026-03-01",
      records: [{ studentId: studentA.id, status: "late" }],
    })

    const record = await db.attendance.findFirst({
      where: {
        schoolId: schoolA.id,
        studentId: studentA.id,
        classId: classA.id,
        date: isolationDate,
        periodId: null,
      },
    })
    schoolAAttendanceId = record!.id
  })

  afterAll(async () => {
    const isolationDate = new Date("2026-03-01T00:00:00.000Z")
    await db.attendance.deleteMany({
      where: { schoolId: schoolA.id, classId: classA.id, date: isolationDate },
    })
    await db.attendance.deleteMany({
      where: { schoolId: schoolB.id, classId: classB.id, date: isolationDate },
    })
  })

  it("School B cannot see School A attendance via getAttendanceList", async () => {
    switchTenant(schoolB.id)

    // School B asks for School A's class -- the action scopes by schoolId,
    // so even if classId is known it returns nothing useful.
    const result = await getAttendanceList({
      classId: classA.id,
      date: "2026-03-01",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      // No enrolled students in classA under schoolB, so rows is empty
      expect(result.data.rows).toHaveLength(0)
    }
  })

  it("School B cannot soft-delete School A attendance", async () => {
    switchTenant(schoolB.id)

    const result = await deleteAttendance(schoolAAttendanceId)

    expect(result.success).toBe(false)
    expect(result.error).toBe("Attendance record not found")

    // Verify record is untouched
    const record = await db.attendance.findUnique({
      where: { id: schoolAAttendanceId },
    })
    expect(record).not.toBeNull()
    expect(record!.deletedAt).toBeNull()
    expect(record!.schoolId).toBe(schoolA.id)
  })

  it("School B cannot restore School A attendance", async () => {
    switchTenant(schoolA.id)

    // First soft-delete as School A (legitimate owner)
    await deleteAttendance(schoolAAttendanceId)

    // Now switch to School B and try to restore
    switchTenant(schoolB.id)
    const result = await restoreAttendance(schoolAAttendanceId)

    expect(result.success).toBe(false)
    expect(result.error).toBe("Deleted attendance record not found")

    // Clean up: restore as School A
    switchTenant(schoolA.id)
    await restoreAttendance(schoolAAttendanceId)
  })

  it("each school sees only its own attendance data", async () => {
    // Mark attendance for School B
    switchTenant(schoolB.id)
    await markAttendance({
      classId: classB.id,
      date: "2026-03-01",
      records: [{ studentId: studentB.id, status: "absent" }],
    })

    // School A sees its record
    switchTenant(schoolA.id)
    const resultA = await getAttendanceList({
      classId: classA.id,
      date: "2026-03-01",
    })
    expect(resultA.success).toBe(true)
    if (resultA.success) {
      expect(resultA.data.rows).toHaveLength(1)
      expect(resultA.data.rows[0].studentId).toBe(studentA.id)
      expect(resultA.data.rows[0].status).toBe("late")
    }

    // School B sees its record
    switchTenant(schoolB.id)
    const resultB = await getAttendanceList({
      classId: classB.id,
      date: "2026-03-01",
    })
    expect(resultB.success).toBe(true)
    if (resultB.success) {
      expect(resultB.data.rows).toHaveLength(1)
      expect(resultB.data.rows[0].studentId).toBe(studentB.id)
      expect(resultB.data.rows[0].status).toBe("absent")
    }
  })

  it("School B markAttendance does not overwrite School A records", async () => {
    switchTenant(schoolB.id)

    // School B tries to mark attendance using School A's class and student
    // The action uses schoolB's context, so if a record is created it will
    // have schoolB's ID -- it cannot collide with schoolA's record.
    await markAttendance({
      classId: classA.id,
      date: "2026-03-01",
      records: [{ studentId: studentA.id, status: "absent" }],
    })

    // School A's original record should remain unchanged
    const schoolARecord = await db.attendance.findFirst({
      where: {
        schoolId: schoolA.id,
        studentId: studentA.id,
        classId: classA.id,
        date: new Date("2026-03-01T00:00:00.000Z"),
        periodId: null,
      },
    })

    expect(schoolARecord).not.toBeNull()
    expect(schoolARecord!.status).toBe("LATE")

    // Clean up the record School B created
    await db.attendance.deleteMany({
      where: {
        schoolId: schoolB.id,
        studentId: studentA.id,
        classId: classA.id,
        date: new Date("2026-03-01T00:00:00.000Z"),
      },
    })
  })
})
