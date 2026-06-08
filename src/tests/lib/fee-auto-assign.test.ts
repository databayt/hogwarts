// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  autoAssignFeesForStudent,
  ensureStudentFeeAssignments,
} from "@/lib/fee-auto-assign"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    schoolYear: {
      findFirst: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
    },
    feeStructure: {
      findMany: vi.fn(),
    },
    feeAssignment: {
      findMany: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/fee-invoice-sync", () => ({
  ensureInvoicesForAssignment: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
}))

const SCHOOL_ID = "school-1"
const STUDENT_ID = "student-1"
const GRADE_ID = "grade-5"
const ACADEMIC_YEAR = "2026-2027"

function setupBaselineMocks(opts: {
  /** Existing FeeAssignment rows for this student+year */
  existing?: { id: string; feeStructureId: string }[]
  /** Active FeeStructure rows that match the grade */
  structures?: { id: string; totalAmount: number }[]
}) {
  vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
    yearName: ACADEMIC_YEAR,
  } as never)
  vi.mocked(db.class.findMany).mockResolvedValue([])
  vi.mocked(db.feeStructure.findMany).mockResolvedValue(
    (opts.structures ?? []) as never
  )
  vi.mocked(db.feeAssignment.findMany).mockResolvedValue(
    (opts.existing ?? []) as never
  )
  // Simulate $transaction running its callback inside a tx scope. The helper
  // creates rows via tx.feeAssignment.create — we record those calls so the
  // test can assert "created" matches "missing".
  vi.mocked(db.$transaction).mockImplementation(async (fn: unknown) => {
    if (typeof fn !== "function") return []
    const tx = {
      feeAssignment: {
        create: vi.fn(({ data }: { data: { feeStructureId: string } }) =>
          Promise.resolve({ id: `assign-${data.feeStructureId}` })
        ),
      },
    }
    // The helper signature is `async (tx) => createdRows`; pass our stub.
    return await (fn as (t: unknown) => Promise<unknown>)(tx)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Founder contract tests
// ---------------------------------------------------------------------------

describe("ensureStudentFeeAssignments", () => {
  it("short-circuits with skipped:1 when academicGradeId is null", async () => {
    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: null,
    })

    expect(result).toEqual({
      created: 0,
      existing: 0,
      skipped: 1,
      assignmentIds: [],
    })
    // No DB queries should have run.
    expect(db.schoolYear.findFirst).not.toHaveBeenCalled()
    expect(db.feeStructure.findMany).not.toHaveBeenCalled()
  })

  it("creates one assignment per matching active FeeStructure", async () => {
    setupBaselineMocks({
      structures: [
        { id: "fs-tuition", totalAmount: 5000 },
        { id: "fs-bus", totalAmount: 600 },
      ],
    })

    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      academicYear: ACADEMIC_YEAR,
      notify: false,
    })

    expect(result.created).toBe(2)
    expect(result.existing).toBe(0)
    expect(result.skipped).toBe(0)
    expect(result.assignmentIds).toHaveLength(2)
    expect(db.$transaction).toHaveBeenCalledTimes(1)
  })

  it("is idempotent — re-running with all assignments existing returns created:0", async () => {
    setupBaselineMocks({
      structures: [{ id: "fs-tuition", totalAmount: 5000 }],
      existing: [{ id: "assign-fs-tuition", feeStructureId: "fs-tuition" }],
    })

    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      academicYear: ACADEMIC_YEAR,
      notify: false,
    })

    expect(result).toEqual({
      created: 0,
      existing: 1,
      skipped: 0,
      assignmentIds: ["assign-fs-tuition"],
    })
    // No transaction needed when nothing is missing.
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("creates only the missing assignments when some already exist", async () => {
    setupBaselineMocks({
      structures: [
        { id: "fs-tuition", totalAmount: 5000 },
        { id: "fs-bus", totalAmount: 600 },
        { id: "fs-uniform", totalAmount: 200 },
      ],
      existing: [{ id: "assign-fs-tuition", feeStructureId: "fs-tuition" }],
    })

    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      academicYear: ACADEMIC_YEAR,
      notify: false,
    })

    expect(result.created).toBe(2)
    expect(result.existing).toBe(1)
    expect(result.assignmentIds).toHaveLength(3)
  })

  it("returns 0/0/0 when no FeeStructure matches the grade (admin hasn't configured fees yet)", async () => {
    setupBaselineMocks({ structures: [] })

    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      academicYear: ACADEMIC_YEAR,
      notify: false,
    })

    expect(result).toEqual({
      created: 0,
      existing: 0,
      skipped: 0,
      assignmentIds: [],
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("falls back to a year-pair when the school has no SchoolYear row", async () => {
    setupBaselineMocks({ structures: [] })
    vi.mocked(db.schoolYear.findFirst).mockResolvedValue(null)

    await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      notify: false,
    })

    // FeeStructure query should still run with a derived academicYear string.
    expect(db.feeStructure.findMany).toHaveBeenCalledTimes(1)
    const call = vi.mocked(db.feeStructure.findMany).mock.calls[0]?.[0]
    const where = (call as { where: { academicYear: string } } | undefined)
      ?.where
    // Format: `${currentYear}-${currentYear + 1}`
    expect(where?.academicYear).toMatch(/^\d{4}-\d{4}$/)
  })

  it("survives P2002 race conditions inside the transaction", async () => {
    setupBaselineMocks({
      structures: [
        { id: "fs-a", totalAmount: 100 },
        { id: "fs-b", totalAmount: 200 },
      ],
    })

    // Make the first create throw P2002 (race), the second succeed.
    vi.mocked(db.$transaction).mockImplementation(async (fn: unknown) => {
      if (typeof fn !== "function") return []
      let callCount = 0
      const tx = {
        feeAssignment: {
          create: vi.fn(({ data }: { data: { feeStructureId: string } }) => {
            callCount += 1
            if (callCount === 1) {
              const err = new Error("Unique constraint failed") as Error & {
                code: string
              }
              err.code = "P2002"
              return Promise.reject(err)
            }
            return Promise.resolve({ id: `assign-${data.feeStructureId}` })
          }),
        },
      }
      return await (fn as (t: unknown) => Promise<unknown>)(tx)
    })

    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      academicYear: ACADEMIC_YEAR,
      notify: false,
    })

    // Only one row was actually created; the racing one is treated as existing.
    expect(result.created).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Backwards-compat wrapper
// ---------------------------------------------------------------------------

describe("autoAssignFeesForStudent (deprecated wrapper)", () => {
  it("returns assignedCount = created + existing for the old contract", async () => {
    setupBaselineMocks({
      structures: [
        { id: "fs-tuition", totalAmount: 5000 },
        { id: "fs-bus", totalAmount: 600 },
      ],
      existing: [{ id: "assign-fs-tuition", feeStructureId: "fs-tuition" }],
    })

    const result = await autoAssignFeesForStudent(
      SCHOOL_ID,
      STUDENT_ID,
      GRADE_ID
    )

    // 1 newly created + 1 pre-existing = 2 total matching structures.
    expect(result.assignedCount).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Pricing-matrix dimension resolution
// ---------------------------------------------------------------------------

/**
 * Build a matrix-aware mock: the structures carry sourceSignals + isAutoGenerated
 * so the variant-group collapse logic engages.
 */
function setupMatrixMocks(opts: {
  structures: Array<{
    id: string
    totalAmount: number
    isAutoGenerated?: boolean
    sourceSignals?: {
      gradeId?: string | null
      streamId?: string | null
      studentType?: string | null
    }
  }>
  student?: { academicStreamId?: string | null; studentType?: string | null }
}) {
  vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
    yearName: ACADEMIC_YEAR,
  } as never)
  vi.mocked(db.class.findMany).mockResolvedValue([])
  vi.mocked(db.feeStructure.findMany).mockResolvedValue(
    opts.structures.map((s) => ({
      isAutoGenerated: s.isAutoGenerated ?? true,
      sourceSignals: s.sourceSignals ?? null,
      ...s,
    })) as never
  )
  vi.mocked(db.feeAssignment.findMany).mockResolvedValue([] as never)
  vi.mocked(db.student.findFirst).mockResolvedValue(
    (opts.student ?? {
      academicStreamId: null,
      studentType: null,
    }) as never
  )
  const created: string[] = []
  vi.mocked(db.$transaction).mockImplementation(async (fn: unknown) => {
    if (typeof fn !== "function") return []
    const tx = {
      feeAssignment: {
        create: vi.fn(({ data }: { data: { feeStructureId: string } }) => {
          created.push(data.feeStructureId)
          return Promise.resolve({ id: `assign-${data.feeStructureId}` })
        }),
      },
    }
    return await (fn as (t: unknown) => Promise<unknown>)(tx)
  })
  return { created }
}

describe("ensureStudentFeeAssignments — pricing-matrix variants", () => {
  it("assigns ONLY the most-specific compatible variant (science student → science fee)", async () => {
    const { created } = setupMatrixMocks({
      structures: [
        {
          id: "fs-base",
          totalAmount: 5000,
          sourceSignals: {
            gradeId: GRADE_ID,
            streamId: null,
            studentType: null,
          },
        },
        {
          id: "fs-science",
          totalAmount: 6000,
          sourceSignals: {
            gradeId: GRADE_ID,
            streamId: "stream-sci",
            studentType: null,
          },
        },
      ],
      student: { academicStreamId: "stream-sci", studentType: "REGULAR" },
    })

    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      academicYear: ACADEMIC_YEAR,
      notify: false,
    })

    // Mutually-exclusive group → exactly one assignment (the science variant).
    expect(result.created).toBe(1)
    expect(created).toEqual(["fs-science"])
  })

  it("falls back to the base variant when the student's stream has no specific price", async () => {
    const { created } = setupMatrixMocks({
      structures: [
        {
          id: "fs-base",
          totalAmount: 5000,
          sourceSignals: {
            gradeId: GRADE_ID,
            streamId: null,
            studentType: null,
          },
        },
        {
          id: "fs-science",
          totalAmount: 6000,
          sourceSignals: {
            gradeId: GRADE_ID,
            streamId: "stream-sci",
            studentType: null,
          },
        },
      ],
      // Arts student — incompatible with the science variant.
      student: { academicStreamId: "stream-arts", studentType: "REGULAR" },
    })

    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      academicYear: ACADEMIC_YEAR,
      notify: false,
    })

    expect(result.created).toBe(1)
    expect(created).toEqual(["fs-base"])
  })

  it("keeps admin/additive structures while collapsing the variant group", async () => {
    const { created } = setupMatrixMocks({
      structures: [
        // Admin school-wide one-time fee (additive, not a grade variant).
        {
          id: "fs-admin",
          totalAmount: 300,
          isAutoGenerated: false,
          sourceSignals: null,
        },
        {
          id: "fs-base",
          totalAmount: 5000,
          sourceSignals: {
            gradeId: GRADE_ID,
            streamId: null,
            studentType: null,
          },
        },
        {
          id: "fs-intl",
          totalAmount: 9000,
          sourceSignals: {
            gradeId: GRADE_ID,
            streamId: null,
            studentType: "INTERNATIONAL",
          },
        },
      ],
      student: { academicStreamId: null, studentType: "INTERNATIONAL" },
    })

    const result = await ensureStudentFeeAssignments({
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      academicGradeId: GRADE_ID,
      academicYear: ACADEMIC_YEAR,
      notify: false,
    })

    // admin (additive) + international variant (most-specific) = 2.
    expect(result.created).toBe(2)
    expect(created.sort()).toEqual(["fs-admin", "fs-intl"])
  })
})
