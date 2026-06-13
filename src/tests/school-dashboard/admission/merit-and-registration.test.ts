// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tests for:
 *  - updateApplicationScores (P0-3)
 *  - generateMeritList — weighted scoring + ranking (P0-3)
 *  - confirmEnrollment — registration-fee materialization (ADMISSION-FEE-NO-LEDGER)
 *  - confirmEnrollment — enrollmentNumber uniqueness (P2-2)
 */

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { ensureStudentFeeAssignments } from "@/lib/fee-auto-assign"
import {
  confirmEnrollment,
  generateMeritList,
  updateApplicationScores,
} from "@/components/school-dashboard/admission/actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    admissionSettings: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    feeStructure: {
      count: vi.fn().mockResolvedValue(0),
      findMany: vi.fn().mockResolvedValue([]),
    },
    feeAssignment: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "fa-new" }),
      update: vi.fn().mockResolvedValue({}),
    },
    payment: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "pay-reg-1" }),
      update: vi.fn().mockResolvedValue({}),
    },
    school: {
      findFirst: vi.fn().mockResolvedValue({ preferredLanguage: "ar" }),
      findUnique: vi.fn().mockResolvedValue({ currency: "USD" }),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue({ role: "USER" }),
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "u-new" }),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({}),
    },
    yearLevel: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    academicGrade: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    schoolYear: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    studentYearLevel: {
      upsert: vi.fn().mockResolvedValue({}),
    },
    section: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    studentGuardian: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    studentDocument: {
      create: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue("notif-1"),
}))

vi.mock("@/lib/fee-auto-assign", () => ({
  ensureStudentFeeAssignments: vi.fn().mockResolvedValue({
    created: 0,
    existing: 0,
    skipped: 0,
    assignmentIds: [],
  }),
}))

vi.mock("@/lib/student-username", () => ({
  generateStudentUsername: vi.fn().mockResolvedValue("26050001"),
}))

vi.mock("@/lib/guardian-utils", () => ({
  createOrLinkGuardian: vi.fn().mockResolvedValue({ id: "g-1" }),
  fromFullName: vi.fn((entry: any) => ({
    firstName: entry.fullName,
    lastName: "",
  })),
}))

vi.mock("@/lib/enrollment-sync", () => ({
  enrollStudentInGradeClasses: vi.fn().mockResolvedValue({ classIds: [] }),
}))

vi.mock("@/lib/grade-utils", () => ({
  extractGradeNumber: vi.fn().mockReturnValue(null),
}))

vi.mock("@/components/school-dashboard/admission/queries", () => ({
  getCampaignsList: vi.fn(),
  getCampaignOptions: vi.fn(),
  getApplicationsList: vi.fn(),
  getMeritList: vi.fn(),
  getEnrollmentList: vi.fn(),
}))

vi.mock("@/components/school-dashboard/admission/validation", () => ({
  campaignSchemaWithValidation: { safeParse: vi.fn() },
}))

// Mock the finance posting-rules so the ledger path is tested cleanly
// (the real module requires db.ledgerAccount which is not in the test db mock).
vi.mock(
  "@/components/school-dashboard/finance/lib/accounting/posting-rules",
  () => ({
    createFeePaymentEntry: vi
      .fn()
      .mockResolvedValue({ debit: "1200", credit: "4000", amount: 500 }),
  })
)

vi.mock("@/components/school-dashboard/finance/lib/accounting/utils", () => ({
  createJournalEntry: vi.fn().mockResolvedValue({
    success: true,
    journalEntryId: "je-reg-1",
  }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-test"
const USER_ID = "admin-1"

function mockAuthenticated() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "ADMIN" },
  } as any)
}

const baseApplication = {
  id: "app-1",
  schoolId: SCHOOL_ID,
  userId: "u-applicant",
  firstName: "Lina",
  middleName: null,
  lastName: "Khoury",
  dateOfBirth: new Date("2010-01-01"),
  gender: "FEMALE",
  nationality: "LB",
  email: "lina@test.com",
  phone: "+9611234567",
  alternatePhone: null,
  address: "1 Cedar St",
  city: "Beirut",
  state: "Beirut",
  postalCode: "00000",
  country: "LB",
  fatherName: null,
  fatherEmail: null,
  fatherPhone: null,
  fatherOccupation: null,
  motherName: null,
  motherEmail: null,
  motherPhone: null,
  motherOccupation: null,
  guardianName: null,
  guardianEmail: null,
  guardianPhone: null,
  guardianRelation: null,
  applyingForClass: "Grade 5",
  status: "SELECTED",
  documents: null,
  previousSchool: null,
  previousClass: null,
  previousMarks: null,
  previousPercentage: null,
  achievements: null,
  category: null,
  photoUrl: null,
  registrationFeePaid: false,
  registrationFeeAmount: null,
  registrationFeeMethod: null,
  registrationFeeReference: null,
  registrationFeeDate: null,
  offerExpiryDate: null,
  campaign: { academicYear: "2026-2027", applicationFee: null },
}

// ---------------------------------------------------------------------------
// Tests: updateApplicationScores
// ---------------------------------------------------------------------------

describe("updateApplicationScores", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated()
    vi.mocked(db.application.findUnique).mockResolvedValue({
      id: "app-1",
    } as any)
    vi.mocked(db.application.update).mockResolvedValue({} as any)
  })

  it("updates entranceScore and interviewScore within 0-100 range", async () => {
    const result = await updateApplicationScores({
      id: "app-1",
      entranceScore: 85,
      interviewScore: 72,
    })

    expect(result.success).toBe(true)
    expect(db.application.update).toHaveBeenCalledWith({
      where: { id: "app-1", schoolId: SCHOOL_ID },
      data: { entranceScore: 85, interviewScore: 72 },
    })
  })

  it("allows null scores (clearing a previously set score)", async () => {
    const result = await updateApplicationScores({
      id: "app-1",
      entranceScore: null,
      interviewScore: null,
    })

    expect(result.success).toBe(true)
    expect(db.application.update).toHaveBeenCalledWith({
      where: { id: "app-1", schoolId: SCHOOL_ID },
      data: { entranceScore: null, interviewScore: null },
    })
  })

  it("rejects scores above 100", async () => {
    const result = await updateApplicationScores({
      id: "app-1",
      entranceScore: 101,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("VALIDATION_ERROR")
    expect(db.application.update).not.toHaveBeenCalled()
  })

  it("rejects negative scores", async () => {
    const result = await updateApplicationScores({
      id: "app-1",
      interviewScore: -1,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("VALIDATION_ERROR")
  })

  it("returns ADMISSION_NOT_FOUND when application does not exist", async () => {
    vi.mocked(db.application.findUnique).mockResolvedValue(null)

    const result = await updateApplicationScores({
      id: "nonexistent",
      entranceScore: 80,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("ADMISSION_NOT_FOUND")
  })

  it("scopes the findUnique check by schoolId (tenant isolation)", async () => {
    await updateApplicationScores({ id: "app-1", entranceScore: 50 })

    expect(db.application.findUnique).toHaveBeenCalledWith({
      where: { id: "app-1", schoolId: SCHOOL_ID },
      select: { id: true },
    })
  })

  it("returns UNAUTHORIZED when no schoolId in session", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: USER_ID, schoolId: null, role: "USER" },
    } as any)

    const result = await updateApplicationScores({
      id: "app-1",
      entranceScore: 80,
    })

    expect(result.success).toBe(false)
    expect(result.error).toBe("UNAUTHORIZED")
  })

  it("is a no-op (success) when no score fields are provided", async () => {
    const result = await updateApplicationScores({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.application.update).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Tests: generateMeritList — weighted scoring
// ---------------------------------------------------------------------------

describe("generateMeritList — weighted scoring", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated()
    vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)
    // Handle both array-style and callback-style $transaction
    vi.mocked(db.$transaction).mockImplementation(async (cbOrArray: any) => {
      if (typeof cbOrArray === "function") return cbOrArray(db)
      if (Array.isArray(cbOrArray)) return Promise.all(cbOrArray)
      return cbOrArray(db)
    })
    vi.mocked(db.application.update).mockResolvedValue({} as any)
  })

  it("computes meritScore with default weights (entrance 60%, interview 40%)", async () => {
    vi.mocked(db.application.findMany).mockResolvedValue([
      { id: "a-1", entranceScore: 100, interviewScore: 100 },
      { id: "a-2", entranceScore: 80, interviewScore: 60 },
    ] as any)

    await generateMeritList({ campaignId: "c-1" })

    // a-1: 100*0.6 + 100*0.4 = 100 → rank 1
    // a-2: 80*0.6 + 60*0.4 = 48+24 = 72 → rank 2
    const updateCalls = vi.mocked(db.application.update).mock.calls
    const byId = Object.fromEntries(
      updateCalls.map((c) => [(c[0] as any).where.id, (c[0] as any).data])
    )
    expect(byId["a-1"].meritScore).toBeCloseTo(100)
    expect(byId["a-1"].meritRank).toBe(1)
    expect(byId["a-2"].meritScore).toBeCloseTo(72)
    expect(byId["a-2"].meritRank).toBe(2)
  })

  it("respects custom weights from AdmissionSettings", async () => {
    vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
      entranceWeight: 70,
      interviewWeight: 30,
    } as any)
    vi.mocked(db.application.findMany).mockResolvedValue([
      { id: "a-1", entranceScore: 60, interviewScore: 100 },
      { id: "a-2", entranceScore: 90, interviewScore: 50 },
    ] as any)

    await generateMeritList({ campaignId: "c-1" })

    // weights: entrance 70/100 = 0.7, interview 30/100 = 0.3
    // a-1: 60*0.7 + 100*0.3 = 42+30 = 72
    // a-2: 90*0.7 + 50*0.3 = 63+15 = 78 → rank 1
    const updateCalls = vi.mocked(db.application.update).mock.calls
    const byId = Object.fromEntries(
      updateCalls.map((c) => [(c[0] as any).where.id, (c[0] as any).data])
    )
    expect(byId["a-2"].meritRank).toBe(1)
    expect(byId["a-1"].meritRank).toBe(2)
  })

  it("ranks applications with no scores last (meritScore null)", async () => {
    vi.mocked(db.application.findMany).mockResolvedValue([
      { id: "a-scored", entranceScore: 50, interviewScore: 50 },
      { id: "a-null", entranceScore: null, interviewScore: null },
    ] as any)

    await generateMeritList({ campaignId: "c-1" })

    const updateCalls = vi.mocked(db.application.update).mock.calls
    const byId = Object.fromEntries(
      updateCalls.map((c) => [(c[0] as any).where.id, (c[0] as any).data])
    )
    expect(byId["a-scored"].meritRank).toBe(1)
    expect(byId["a-null"].meritRank).toBe(2)
    expect(byId["a-null"].meritScore).toBeNull()
  })

  it("uses entrance score alone when interview score is absent", async () => {
    vi.mocked(db.application.findMany).mockResolvedValue([
      { id: "a-1", entranceScore: 90, interviewScore: null },
      { id: "a-2", entranceScore: 70, interviewScore: null },
    ] as any)

    await generateMeritList({ campaignId: "c-1" })

    const updateCalls = vi.mocked(db.application.update).mock.calls
    const byId = Object.fromEntries(
      updateCalls.map((c) => [(c[0] as any).where.id, (c[0] as any).data])
    )
    expect(byId["a-1"].meritRank).toBe(1)
    expect(byId["a-2"].meritRank).toBe(2)
  })

  it("writes meritScore and meritRank for each application inside $transaction", async () => {
    vi.mocked(db.application.findMany).mockResolvedValue([
      { id: "a-1", entranceScore: 80, interviewScore: 70 },
    ] as any)

    await generateMeritList({ campaignId: "c-1" })

    expect(db.$transaction).toHaveBeenCalled()
    expect(db.application.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "a-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({
          meritScore: expect.any(Number),
          meritRank: 1,
        }),
      })
    )
  })

  it("returns success for empty campaign (no applications)", async () => {
    vi.mocked(db.application.findMany).mockResolvedValue([])

    const result = await generateMeritList({ campaignId: "c-empty" })

    expect(result.success).toBe(true)
    expect(db.application.update).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Tests: confirmEnrollment — registration-fee materialization
// ---------------------------------------------------------------------------

describe("confirmEnrollment — registration-fee materialization", () => {
  function setupEnrollment(overrides: Partial<typeof baseApplication> = {}) {
    vi.mocked(db.application.findUnique).mockResolvedValue({
      ...baseApplication,
      ...overrides,
    } as any)
    vi.mocked(db.application.update).mockResolvedValue({} as any)
    vi.mocked(db.student.findUnique).mockResolvedValue(null)
    vi.mocked(db.student.create).mockResolvedValue({
      id: "student-new",
      schoolId: SCHOOL_ID,
    } as any)
    vi.mocked(db.user.findUnique).mockResolvedValue({ role: "USER" } as any)
    vi.mocked(db.user.update).mockResolvedValue({} as any)
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated()
    vi.mocked(db.$transaction).mockImplementation(async (cbOrArray: any) => {
      if (typeof cbOrArray === "function") return cbOrArray(db)
      if (Array.isArray(cbOrArray)) return Promise.all(cbOrArray)
      return cbOrArray(db)
    })
    vi.mocked(db.student.count).mockResolvedValue(0)
    vi.mocked(db.student.findFirst).mockResolvedValue(null) // no admissionNumber conflict
  })

  it("creates Payment row when registrationFeePaid=true and a matching fee assignment exists", async () => {
    setupEnrollment({
      registrationFeePaid: true,
      registrationFeeAmount: 500 as any,
      registrationFeeMethod: "cash",
      registrationFeeReference: "REF-001",
    })
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: "fa-reg-1",
      status: "PENDING",
    } as any)
    vi.mocked(db.payment.findFirst).mockResolvedValue(null) // no existing payment
    vi.mocked(db.payment.create).mockResolvedValue({ id: "pay-reg-new" } as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          studentId: "student-new",
          feeAssignmentId: "fa-reg-1",
          amount: 500,
          paymentMethod: "CASH",
          status: "SUCCESS",
          transactionId: "REF-001",
        }),
      })
    )
  })

  it("marks the fee assignment PAID after creating the payment", async () => {
    setupEnrollment({
      registrationFeePaid: true,
      registrationFeeAmount: 500 as any,
      registrationFeeMethod: "cash",
    })
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: "fa-reg-1",
      status: "PENDING",
    } as any)
    vi.mocked(db.payment.findFirst).mockResolvedValue(null)
    vi.mocked(db.payment.create).mockResolvedValue({ id: "pay-new" } as any)

    await confirmEnrollment({ id: "app-1" })

    expect(db.feeAssignment.update).toHaveBeenCalledWith({
      where: { id: "fa-reg-1" },
      data: { status: "PAID" },
    })
  })

  it("is idempotent — skips Payment creation if one already exists for the assignment", async () => {
    setupEnrollment({
      registrationFeePaid: true,
      registrationFeeAmount: 500 as any,
      registrationFeeMethod: "cash",
    })
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: "fa-reg-1",
      status: "PAID",
    } as any)
    // Existing payment found → should skip creation
    vi.mocked(db.payment.findFirst).mockResolvedValue({
      id: "pay-existing",
    } as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(db.payment.create).not.toHaveBeenCalled()
  })

  it("adds REGISTRATION_FEE_NO_STRUCTURE warning when no fee assignment exists", async () => {
    setupEnrollment({
      registrationFeePaid: true,
      registrationFeeAmount: 500 as any,
      registrationFeeMethod: "cash",
    })
    // No matching fee assignment found
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue(null)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    expect(result.data?.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "REGISTRATION_FEE_NO_STRUCTURE" }),
      ])
    )
    expect(db.payment.create).not.toHaveBeenCalled()
  })

  it("skips the whole registration-fee block when registrationFeePaid is false", async () => {
    setupEnrollment({ registrationFeePaid: false })

    await confirmEnrollment({ id: "app-1" })

    expect(db.feeAssignment.findFirst).not.toHaveBeenCalled()
    expect(db.payment.create).not.toHaveBeenCalled()
  })

  it("maps bank_transfer registrationFeeMethod to BANK_TRANSFER enum", async () => {
    setupEnrollment({
      registrationFeePaid: true,
      registrationFeeAmount: 300 as any,
      registrationFeeMethod: "bank_transfer",
    })
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: "fa-reg-1",
      status: "PENDING",
    } as any)
    vi.mocked(db.payment.findFirst).mockResolvedValue(null)
    vi.mocked(db.payment.create).mockResolvedValue({ id: "pay-new" } as any)

    await confirmEnrollment({ id: "app-1" })

    expect(db.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentMethod: "BANK_TRANSFER" }),
      })
    )
  })

  it("writes journalEntryId onto the payment record after ledger posting succeeds", async () => {
    const { createFeePaymentEntry } =
      await import("@/components/school-dashboard/finance/lib/accounting/posting-rules")
    const { createJournalEntry } =
      await import("@/components/school-dashboard/finance/lib/accounting/utils")
    vi.mocked(createFeePaymentEntry).mockResolvedValue({
      debit: "1200",
      credit: "4000",
      amount: 500,
    } as any)
    vi.mocked(createJournalEntry).mockResolvedValue({
      success: true,
      journalEntryId: "je-test-1",
    } as any)

    setupEnrollment({
      registrationFeePaid: true,
      registrationFeeAmount: 500 as any,
      registrationFeeMethod: "cash",
    })
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: "fa-reg-1",
      status: "PENDING",
    } as any)
    vi.mocked(db.payment.findFirst).mockResolvedValue(null)
    vi.mocked(db.payment.create).mockResolvedValue({ id: "pay-je-test" } as any)

    await confirmEnrollment({ id: "app-1" })

    // payment.update must be called to stamp journalEntryId
    expect(db.payment.update).toHaveBeenCalledWith({
      where: { id: "pay-je-test" },
      data: { journalEntryId: "je-test-1" },
    })
  })
})

// ---------------------------------------------------------------------------
// Tests: confirmEnrollment — enrollmentNumber uniqueness (P2-2)
// ---------------------------------------------------------------------------

describe("confirmEnrollment — enrollmentNumber uniqueness", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated()
    vi.mocked(db.$transaction).mockImplementation(async (cbOrArray: any) => {
      if (typeof cbOrArray === "function") return cbOrArray(db)
      if (Array.isArray(cbOrArray)) return Promise.all(cbOrArray)
      return cbOrArray(db)
    })
    vi.mocked(db.application.findUnique).mockResolvedValue(
      baseApplication as any
    )
    vi.mocked(db.application.update).mockResolvedValue({} as any)
    vi.mocked(db.student.create).mockResolvedValue({
      id: "student-new",
      schoolId: SCHOOL_ID,
    } as any)
    vi.mocked(db.student.findUnique).mockResolvedValue(null)
    vi.mocked(db.user.findUnique).mockResolvedValue({ role: "USER" } as any)
    vi.mocked(db.user.update).mockResolvedValue({} as any)
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue(null)
    vi.mocked(db.student.findFirst).mockResolvedValue(null) // no conflict
  })

  it("generates a deterministic ENR-YY-NNNN number (no Math.random)", async () => {
    vi.mocked(db.student.count).mockResolvedValue(5)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    const updateCall = vi
      .mocked(db.application.update)
      .mock.calls.find((c) => (c[0] as any).data?.enrollmentNumber)
    const enrollmentNumber = (updateCall?.[0] as any)?.data?.enrollmentNumber
    expect(enrollmentNumber).toBeDefined()
    // Format: ENR-YY-NNNN (where YY = 2-digit year, NNNN = padded seq)
    expect(enrollmentNumber).toMatch(/^ENR-\d{2}-\d{4}$/)
  })

  it("retries on conflict — skips taken numbers", async () => {
    vi.mocked(db.student.count).mockResolvedValue(0)
    // First candidate (seq=1) conflicts; second (seq=2) does not
    vi.mocked(db.student.findFirst)
      .mockResolvedValueOnce({ id: "existing-student" } as any)
      .mockResolvedValue(null)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    const updateCall = vi
      .mocked(db.application.update)
      .mock.calls.find((c) => (c[0] as any).data?.enrollmentNumber)
    const enrollmentNumber = (updateCall?.[0] as any)?.data?.enrollmentNumber
    // Should have skipped seq=1 and used seq=2
    expect(enrollmentNumber).toMatch(/^ENR-\d{2}-0002$/)
  })

  it("falls back to timestamp when all retries are exhausted", async () => {
    vi.mocked(db.student.count).mockResolvedValue(0)
    // All 10 candidates conflict
    vi.mocked(db.student.findFirst).mockResolvedValue({
      id: "always-conflicts",
    } as any)

    const result = await confirmEnrollment({ id: "app-1" })

    expect(result.success).toBe(true)
    const updateCall = vi
      .mocked(db.application.update)
      .mock.calls.find((c) => (c[0] as any).data?.enrollmentNumber)
    const enrollmentNumber = (updateCall?.[0] as any)?.data?.enrollmentNumber
    // Timestamp fallback: ENR-<13 digit timestamp>
    expect(enrollmentNumber).toMatch(/^ENR-\d{13,}$/)
  })
})
