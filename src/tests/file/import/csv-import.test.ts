// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for file/import/csv-import.ts — students path
 *
 * Covers the rewire onto the shared `provisionStudent` core:
 * - Phase 1 validation/dedup is preserved (bad/duplicate rows are skipped,
 *   not sent to provisionStudent)
 * - Row -> ProvisionStudentInput mapping (names, resolved grade/section,
 *   guardians with createLogin:true, applyingForClass, academicYear)
 * - Gender enum-safety: "male"/"female" map to the Prisma-safe "MALE"/"FEMALE"
 *   for provisionStudent (whose shadow-Application write casts into the
 *   Gender enum), while the CSV's own value (including "other") is restored
 *   onto Student.gender afterward in the same transaction
 * - origin (AdmissionChannel) is threaded into provisionStudent's options
 * - Rows are provisioned SEQUENTIALLY (no overlapping provisionStudent calls)
 * - A single row's provisioning failure doesn't abort the batch
 * - Credentials returned by provisionStudent are surfaced in the result
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { provisionStudent } from "@/lib/student-provisioning"
import { importStudents } from "@/components/file/import/csv-import"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const { txStudentUpdateMock, transactionMock } = vi.hoisted(() => ({
  txStudentUpdateMock: vi.fn().mockResolvedValue({}),
  transactionMock: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
    academicGrade: {
      findMany: vi.fn(),
    },
    section: {
      findMany: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
    },
    $transaction: transactionMock,
  },
}))

vi.mock("@/lib/student-provisioning", () => ({
  provisionStudent: vi.fn(),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/student-access-code", () => ({
  generateAccessCodesForStudents: vi.fn().mockResolvedValue([]),
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-1"

function csv(rows: string[]): string {
  const header =
    "name,email,yearLevel,gender,dateOfBirth,guardianName,guardianEmail,guardianPhone"
  return [header, ...rows].join("\n")
}

function mockProvisionResult(overrides?: {
  studentId?: string
  userId?: string
  applicationId?: string
  isNewUser?: boolean
  credentials?: { username: string; password: string } | undefined
  warnings?: Array<{ code: string }>
}) {
  return {
    studentId: overrides?.studentId ?? "student-1",
    userId: overrides?.userId ?? "user-1",
    applicationId: overrides?.applicationId ?? "app-1",
    isNewUser: overrides?.isNewUser ?? true,
    credentials: overrides?.credentials ?? {
      username: "26070001",
      password: "Temp-pw-1",
    },
    warnings: overrides?.warnings ?? [],
  }
}

beforeEach(() => {
  vi.clearAllMocks()

  vi.mocked(db.student.findMany).mockResolvedValue([])
  vi.mocked(db.user.findMany).mockResolvedValue([])
  vi.mocked(db.academicGrade.findMany).mockResolvedValue([
    { id: "grade-7", name: "Grade 7", gradeNumber: 7 },
  ] as never)
  vi.mocked(db.section.findMany).mockResolvedValue([])
  vi.mocked(db.schoolYear.findFirst).mockResolvedValue({
    yearName: "2026-2027",
  } as never)

  // db.$transaction invokes the callback with a fake tx exposing only what
  // importStudents touches (student.update, for the gender-fidelity patch).
  transactionMock.mockImplementation(
    async (fn: (tx: unknown) => unknown, _opts?: unknown) =>
      fn({ student: { update: txStudentUpdateMock } })
  )
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("importStudents (students path via provisionStudent)", () => {
  it("maps a row to ProvisionStudentInput, resolves grade, includes a guardian with createLogin:true, and threads origin", async () => {
    vi.mocked(provisionStudent).mockResolvedValueOnce(mockProvisionResult())

    const content = csv([
      "Ali Mohammed,ali.m@school.local,Grade 7,male,2012-03-15,Khalid Mohammed,khalid@parent.local,+249912345001",
    ])

    const result = await importStudents(content, SCHOOL_ID, "BULK_IMPORT")

    expect(provisionStudent).toHaveBeenCalledTimes(1)
    const [input, opts] = vi.mocked(provisionStudent).mock.calls[0]

    expect(input).toEqual(
      expect.objectContaining({
        schoolId: SCHOOL_ID,
        firstName: "Ali",
        middleName: null,
        lastName: "Mohammed",
        dateOfBirth: new Date("2012-03-15"),
        gender: "MALE",
        email: "ali.m@school.local",
        academicGradeId: "grade-7",
        sectionId: null,
        applyingForClass: "Grade 7",
        academicYear: "2026-2027",
        guardians: [
          expect.objectContaining({
            typeName: "guardian",
            firstName: "Khalid",
            lastName: "Mohammed",
            email: "khalid@parent.local",
            phone: "+249912345001",
            isPrimary: true,
            createLogin: true,
          }),
        ],
      })
    )

    expect(opts).toEqual({
      notify: false,
      credentialDelivery: "temp-password",
      origin: "BULK_IMPORT",
    })

    // The db.$transaction wrapper is per-row and carries a generous timeout —
    // provisionStudent runs a long sequence of queries inside it.
    expect(transactionMock).toHaveBeenCalledTimes(1)
    expect(transactionMock.mock.calls[0][1]).toEqual({ timeout: 15000 })

    expect(result.imported).toBe(1)
    expect(result.failed).toBe(0)
    expect(result.success).toBe(true)
    expect(result.credentials).toEqual([
      expect.objectContaining({
        row: 2,
        name: "Ali Mohammed",
        username: "26070001",
        email: "ali.m@school.local",
        role: "STUDENT",
        password: "Temp-pw-1",
      }),
    ])
  })

  it("omits guardians entirely when the row has no guardianName", async () => {
    vi.mocked(provisionStudent).mockResolvedValueOnce(mockProvisionResult())

    const content = csv(["Sara Ahmed,sara.a@school.local,Grade 7,female,,,,"])

    await importStudents(content, SCHOOL_ID, "BULK_IMPORT")

    const [input] = vi.mocked(provisionStudent).mock.calls[0]
    expect(input.guardians).toEqual([])
  })

  it("maps 'other'/missing gender to an enum-safe undefined for provisionStudent, then restores the original value onto Student.gender in the same transaction", async () => {
    vi.mocked(provisionStudent).mockResolvedValueOnce(
      mockProvisionResult({ studentId: "student-other" })
    )

    const content = csv(["Noor Salim,noor.s@school.local,Grade 7,other,,,,"])

    await importStudents(content, SCHOOL_ID, "BULK_IMPORT")

    const [input] = vi.mocked(provisionStudent).mock.calls[0]
    // Prisma's Gender enum only defines MALE/FEMALE (see
    // ensureDirectAdmitApplication) — "other" must never reach that cast.
    expect(input.gender).toBeUndefined()

    // Student.gender has no enum constraint — the row's original value is
    // restored right after provisionStudent returns, inside the same tx.
    expect(txStudentUpdateMock).toHaveBeenCalledWith({
      where: { id: "student-other" },
      data: { gender: "other" },
    })
  })

  it("restores lowercase gender fidelity for male/female rows too (matches the student wizard's lowercase convention)", async () => {
    vi.mocked(provisionStudent).mockResolvedValueOnce(
      mockProvisionResult({ studentId: "student-male" })
    )

    const content = csv(["Ali Mohammed,,Grade 7,male,,,,"])

    await importStudents(content, SCHOOL_ID, "BULK_IMPORT")

    expect(txStudentUpdateMock).toHaveBeenCalledWith({
      where: { id: "student-male" },
      data: { gender: "male" },
    })
  })

  it("processes rows sequentially — never starts a second provisionStudent call before the first resolves", async () => {
    let concurrent = 0
    let maxConcurrent = 0

    vi.mocked(provisionStudent).mockImplementation(async (input) => {
      concurrent++
      maxConcurrent = Math.max(maxConcurrent, concurrent)
      await new Promise((resolve) => setTimeout(resolve, 5))
      concurrent--
      return mockProvisionResult({ studentId: `student-${input.email}` })
    })

    const content = csv([
      "Ali Mohammed,ali.m@school.local,Grade 7,male,,,,",
      "Sara Ahmed,sara.a@school.local,Grade 7,female,,,,",
      "Musa Omer,musa.o@school.local,Grade 7,male,,,,",
    ])

    const result = await importStudents(content, SCHOOL_ID, "BULK_IMPORT")

    expect(maxConcurrent).toBe(1)
    expect(provisionStudent).toHaveBeenCalledTimes(3)
    expect(result.imported).toBe(3)
  })

  it("isolates a single row's provisioning failure — the rest of the batch still imports", async () => {
    vi.mocked(provisionStudent)
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(mockProvisionResult({ studentId: "student-2" }))

    const content = csv([
      "Ali Mohammed,ali.m@school.local,Grade 7,male,,,,",
      "Sara Ahmed,sara.a@school.local,Grade 7,female,,,,",
    ])

    const result = await importStudents(content, SCHOOL_ID, "BULK_IMPORT")

    expect(provisionStudent).toHaveBeenCalledTimes(2)
    expect(result.imported).toBe(1)
    expect(result.failed).toBe(1)
    expect(result.errors).toEqual([
      expect.objectContaining({ row: 2, error: "boom" }),
    ])
    // Row 3 (Sara) still succeeded despite row 2 throwing.
    expect(result.credentials).toHaveLength(1)
  })

  it("keeps Phase 1 dedup — a row whose email already exists is skipped without ever reaching provisionStudent", async () => {
    vi.mocked(db.user.findMany).mockResolvedValue([
      { email: "dup@school.local" },
    ] as never)

    const content = csv(["Ali Mohammed,dup@school.local,Grade 7,male,,,,"])

    const result = await importStudents(content, SCHOOL_ID, "BULK_IMPORT")

    expect(provisionStudent).not.toHaveBeenCalled()
    expect(result.skipped).toBe(1)
    expect(result.imported).toBe(0)
  })

  it("surfaces an aggregate warning for rows with no recognized grade, derived locally rather than from provisionStudent internals", async () => {
    vi.mocked(provisionStudent).mockResolvedValueOnce(mockProvisionResult())

    // "Grade 99" doesn't match the single seeded AcademicGrade (gradeNumber 7).
    const content = csv(["Ali Mohammed,,Grade 99,male,,,,"])

    const result = await importStudents(content, SCHOOL_ID, "BULK_IMPORT")

    const [input] = vi.mocked(provisionStudent).mock.calls[0]
    expect(input.academicGradeId).toBeNull()

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row: 0,
          warning: expect.stringContaining(
            "1 student(s) imported without a recognized grade"
          ),
        }),
      ])
    )
  })
})
