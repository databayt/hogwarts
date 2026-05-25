// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      findMany: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock(
  "@/components/school-dashboard/attendance/authorization",
  () => ({
    canMarkAttendance: vi.fn(() => true),
    canViewSchoolAnalytics: vi.fn(() => true),
    isStaffRole: vi.fn(() => true),
  })
)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-1"
const CLASS_ID = "class-1"
const USER_ID = "user-1"
const UPLOAD_DATE = "2026-05-25"

function bulkInput(
  studentIds: string[],
  overrides: Partial<{ status: string; method: string }> = {}
) {
  return {
    classId: CLASS_ID,
    date: UPLOAD_DATE,
    method: (overrides.method ?? "BULK_UPLOAD") as never,
    records: studentIds.map((studentId) => ({
      studentId,
      status: (overrides.status ?? "PRESENT") as never,
      checkInTime: undefined,
      checkOutTime: undefined,
      notes: undefined,
    })),
  }
}

function setupAuthAndTenant() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "test-school",
    role: "TEACHER",
    locale: "en",
  } as never)
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, role: "TEACHER", schoolId: SCHOOL_ID },
    expires: new Date(Date.now() + 86400000).toISOString(),
  } as never)
}

// ---------------------------------------------------------------------------
// Tests — issue #335 (N+1 fix)
// ---------------------------------------------------------------------------

describe("bulkUploadAttendance — batched prefetch (issue #335)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupAuthAndTenant()
    // Default: all students exist, class exists, no prior attendance rows.
    vi.mocked(db.student.findMany).mockResolvedValue([
      { id: "stu-1" },
      { id: "stu-2" },
      { id: "stu-3" },
    ] as never)
    vi.mocked(db.class.findFirst).mockResolvedValue({
      id: CLASS_ID,
      schoolId: SCHOOL_ID,
    } as never)
    vi.mocked(db.attendance.findMany).mockResolvedValue([] as never)
    // $transaction stub invokes the callback with a stub tx so we can capture
    // the inner update/createMany calls.
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) =>
      cb({
        attendance: {
          update: vi.fn(),
          createMany: vi.fn(),
        },
      })
    )
  })

  it("issues exactly ONE attendance.findMany prefetch — not one per record (the N+1 fix)", async () => {
    const { bulkUploadAttendance } = await import("../actions/bulk")
    await bulkUploadAttendance(bulkInput(["stu-1", "stu-2", "stu-3"]))

    // Three findMany calls total: 1 for students (Phase 1), 1 for prefetch
    // (Phase 1b). The previous implementation issued findFirst N times
    // INSIDE the transaction (3 here) on top of those — now zero.
    const attendanceFindManyCalls = vi.mocked(db.attendance.findMany).mock.calls
    expect(attendanceFindManyCalls).toHaveLength(1)

    // The prefetch query must be scoped by tenant + classId + date + the
    // student-ID set — never a bare findMany that would leak across tenants.
    const where = attendanceFindManyCalls[0][0]!.where!
    expect(where.schoolId).toBe(SCHOOL_ID)
    expect(where.classId).toBe(CLASS_ID)
    expect(where.deletedAt).toBe(null)
    expect((where.studentId as { in: string[] }).in).toEqual([
      "stu-1",
      "stu-2",
      "stu-3",
    ])
  })

  it("routes every record to createMany (one call, all rows) when no prior attendance exists", async () => {
    let capturedTx: { attendance: { update: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> } } | undefined
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      capturedTx = {
        attendance: {
          update: vi.fn(),
          createMany: vi.fn(),
        },
      }
      return cb(capturedTx)
    })

    const { bulkUploadAttendance } = await import("../actions/bulk")
    const result = await bulkUploadAttendance(
      bulkInput(["stu-1", "stu-2", "stu-3"])
    )

    expect(result.successful).toBe(3)
    expect(result.failed).toBe(0)
    expect(result.rolledBack).toBe(false)
    expect(capturedTx?.attendance.update).not.toHaveBeenCalled()
    expect(capturedTx?.attendance.createMany).toHaveBeenCalledTimes(1)
    const createManyArgs = capturedTx!.attendance.createMany.mock.calls[0][0]
    expect(createManyArgs.data).toHaveLength(3)
    expect(createManyArgs.data[0].schoolId).toBe(SCHOOL_ID)
    expect(createManyArgs.data[0].markedBy).toBe(USER_ID)
  })

  it("routes every record to update — and skips createMany entirely — when all records have prior rows", async () => {
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { id: "att-1", studentId: "stu-1" },
      { id: "att-2", studentId: "stu-2" },
      { id: "att-3", studentId: "stu-3" },
    ] as never)

    let capturedTx: { attendance: { update: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> } } | undefined
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      capturedTx = {
        attendance: {
          update: vi.fn(),
          createMany: vi.fn(),
        },
      }
      return cb(capturedTx)
    })

    const { bulkUploadAttendance } = await import("../actions/bulk")
    const result = await bulkUploadAttendance(
      bulkInput(["stu-1", "stu-2", "stu-3"])
    )

    expect(result.successful).toBe(3)
    expect(capturedTx?.attendance.update).toHaveBeenCalledTimes(3)
    expect(capturedTx?.attendance.createMany).not.toHaveBeenCalled()
    // First update should target the matching existing row, not some other id.
    expect(capturedTx!.attendance.update.mock.calls[0][0].where.id).toBe("att-1")
  })

  it("splits mixed input: updates known rows, batches new rows into a single createMany", async () => {
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { id: "att-1", studentId: "stu-1" },
    ] as never)

    let capturedTx: { attendance: { update: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> } } | undefined
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
      capturedTx = {
        attendance: {
          update: vi.fn(),
          createMany: vi.fn(),
        },
      }
      return cb(capturedTx)
    })

    const { bulkUploadAttendance } = await import("../actions/bulk")
    const result = await bulkUploadAttendance(
      bulkInput(["stu-1", "stu-2", "stu-3"])
    )

    expect(result.successful).toBe(3)
    expect(capturedTx?.attendance.update).toHaveBeenCalledTimes(1)
    expect(capturedTx?.attendance.createMany).toHaveBeenCalledTimes(1)
    const createManyArgs = capturedTx!.attendance.createMany.mock.calls[0][0]
    expect(createManyArgs.data).toHaveLength(2)
    expect(
      createManyArgs.data.map((d: { studentId: string }) => d.studentId).sort()
    ).toEqual(["stu-2", "stu-3"])
  })

  it("preserves the existing rollback contract when the transaction throws", async () => {
    vi.mocked(db.$transaction).mockRejectedValue(new Error("constraint violation"))

    const { bulkUploadAttendance } = await import("../actions/bulk")
    const result = await bulkUploadAttendance(bulkInput(["stu-1"]))

    expect(result.successful).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.rolledBack).toBe(true)
    expect(result.errors[0].error).toContain("constraint violation")
  })

  it("does not prefetch when validation fails (missing student) — Phase 1 still short-circuits", async () => {
    vi.mocked(db.student.findMany).mockResolvedValue([{ id: "stu-1" }] as never)

    const { bulkUploadAttendance } = await import("../actions/bulk")
    const result = await bulkUploadAttendance(
      bulkInput(["stu-1", "stu-missing"])
    )

    expect(result.successful).toBe(0)
    expect(result.failed).toBe(1)
    expect(result.rolledBack).toBe(true)
    // The attendance.findMany prefetch must NOT run when validation already
    // aborted, otherwise the optimization "leaks" an extra query on errors.
    expect(db.attendance.findMany).not.toHaveBeenCalled()
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
