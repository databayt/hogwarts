// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { confirmEnrollment } from "@/components/school-dashboard/admission/actions"

// ---------------------------------------------------------------------------
// Mocks — follows the same pattern as actions.test.ts
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    admissionCampaign: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
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
    },
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    section: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    studentClass: {
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    yearLevel: {
      findFirst: vi.fn(),
    },
    schoolYear: {
      findFirst: vi.fn(),
    },
    studentYearLevel: {
      upsert: vi.fn(),
    },
    feeStructure: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    feeAssignment: {
      upsert: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    guardianType: {
      upsert: vi.fn(),
    },
    guardian: {
      findFirst: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    studentGuardian: {
      create: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    guardianPhoneNumber: {
      create: vi.fn(),
      upsert: vi.fn(),
    },
    studentDocument: {
      create: vi.fn(),
    },
    admissionSettings: {
      findUnique: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    academicGrade: {
      findFirst: vi.fn(),
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

vi.mock("@/lib/enrollment-sync", () => ({
  enrollStudentInGradeClasses: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/grade-utils", () => ({
  extractGradeNumber: vi.fn().mockReturnValue(null),
}))

vi.mock("@/components/school-dashboard/finance/invoice/actions", () => ({
  createInvoiceFromEnrollment: vi.fn().mockResolvedValue({ success: true }),
}))

// Mock the authorization module to let calls through
vi.mock("@/components/school-dashboard/admission/authorization", () => ({
  assertAdmissionPermission: vi.fn(),
}))

vi.mock("@/components/school-dashboard/admission/queries", () => ({
  getCampaignsList: vi.fn(),
  getCampaignOptions: vi.fn(),
  getApplicationsList: vi.fn(),
  getMeritList: vi.fn(),
  getEnrollmentList: vi.fn(),
}))

vi.mock("@/components/school-dashboard/admission/validation", () => ({
  campaignSchemaWithValidation: {
    safeParse: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"
const USER_ID = "user-1"
const APP_ID = "app-1"
const APPLICANT_USER_ID = "applicant-user-1"

function mockAuthenticated() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER_ID, schoolId: SCHOOL_ID, role: "ADMIN" },
  } as any)
}

/**
 * Configures all db mocks for a successful enrollment flow.
 * The $transaction mock calls the callback with `db` so that all
 * the inner tx.* calls resolve against the same mocked db object.
 */
function setupEnrollmentMocks(overrides?: {
  feeStructures?: any[]
  pendingFees?: any[]
  guardianLinks?: any[]
  hasUserId?: boolean
}) {
  const hasFees = (overrides?.feeStructures ?? []).length > 0
  const pendingFees =
    overrides?.pendingFees ??
    (hasFees ? [{ finalAmount: "500.00" }, { finalAmount: "300.00" }] : [])
  const guardianLinks = overrides?.guardianLinks ?? []

  // Auth
  mockAuthenticated()

  // $transaction calls the callback with db
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => cb(db))

  // 1. Fetch application
  vi.mocked(db.application.findUnique).mockResolvedValue({
    id: APP_ID,
    schoolId: SCHOOL_ID,
    userId: overrides?.hasUserId === false ? null : APPLICANT_USER_ID,
    firstName: "Ahmed",
    lastName: "Ali",
    email: "ahmed@example.com",
    phone: "0501234567",
    dateOfBirth: new Date("2010-05-15"),
    gender: "MALE",
    nationality: "SA",
    address: "123 Main St",
    city: "Riyadh",
    state: "Riyadh",
    postalCode: "12345",
    country: "SA",
    fatherName: "Ali Ahmed",
    fatherPhone: "0509876543",
    fatherEmail: "ali@example.com",
    fatherOccupation: "Engineer",
    motherName: "Fatima Ahmed",
    motherPhone: "0507654321",
    motherEmail: "fatima@example.com",
    motherOccupation: "Teacher",
    guardianName: null,
    guardianRelation: null,
    guardianPhone: null,
    guardianEmail: null,
    previousSchool: "Al-Noor School",
    previousClass: "Grade 5",
    previousMarks: "95",
    previousPercentage: "95",
    achievements: "Math Olympiad",
    applyingForClass: "Grade 6",
    photoUrl: null,
    documents: null,
    category: null,
    middleName: null,
    alternatePhone: null,
    status: "SELECTED",
    campaign: { academicYear: "2026-2027" },
  } as any)

  // 2. Application update (status -> ADMITTED)
  vi.mocked(db.application.update).mockResolvedValue({} as any)

  // 3. Student — no existing student, create a new one
  vi.mocked(db.student.findUnique).mockResolvedValue(null)
  vi.mocked(db.student.create).mockResolvedValue({
    id: "student-1",
    schoolId: SCHOOL_ID,
  } as any)
  vi.mocked(db.student.update).mockResolvedValue({} as any)

  // 4. Year level matching — skip for simplicity
  vi.mocked(db.yearLevel.findFirst).mockResolvedValue(null)
  vi.mocked(db.academicGrade.findFirst).mockResolvedValue(null)

  // 5. User role update
  vi.mocked(db.user.findUnique).mockResolvedValue({
    role: "USER",
    schoolId: null,
  } as any)
  vi.mocked(db.user.update).mockResolvedValue({} as any)
  vi.mocked(db.user.create).mockResolvedValue({
    id: "new-user-1",
  } as any)

  // 6. Fee structures
  vi.mocked(db.feeStructure.findMany).mockResolvedValue(
    (overrides?.feeStructures ?? []).map((fs: any, i: number) => ({
      id: `fs-${i + 1}`,
      name: fs.name ?? `Fee ${i + 1}`,
      totalAmount: fs.totalAmount ?? "500.00",
      ...fs,
    }))
  )
  vi.mocked(db.feeStructure.count).mockResolvedValue(0)
  vi.mocked(db.feeAssignment.upsert).mockResolvedValue({} as any)
  vi.mocked(db.feeAssignment.create).mockResolvedValue({ id: "fa-new" } as any)
  vi.mocked(db.class.findMany).mockResolvedValue([] as any)

  // Post-transaction fee query
  vi.mocked(db.feeAssignment.findMany).mockResolvedValue(
    pendingFees.map((fee: any, i: number) => ({
      id: `fa-${i + 1}`,
      finalAmount: fee.finalAmount,
      status: "PENDING",
      feeStructure: { name: `Fee ${i + 1}` },
    }))
  )

  // 7. Guardian records
  vi.mocked(db.guardianType.upsert).mockResolvedValue({
    id: "gt-1",
    name: "father",
  } as any)
  vi.mocked(db.guardian.upsert).mockResolvedValue({
    id: "guardian-1",
  } as any)
  vi.mocked(db.guardian.create).mockResolvedValue({
    id: "guardian-2",
  } as any)
  vi.mocked(db.studentGuardian.upsert).mockResolvedValue({} as any)
  vi.mocked(db.guardianPhoneNumber.upsert).mockResolvedValue({} as any)

  // Post-transaction guardian query
  vi.mocked(db.studentGuardian.findMany).mockResolvedValue(
    guardianLinks.map((link: any) => ({
      guardian: { userId: link.userId },
    }))
  )

  // 8. Document records (no documents by default)
  vi.mocked(db.studentDocument.create).mockResolvedValue({} as any)

  // Section suggestion
  vi.mocked(db.section.findMany).mockResolvedValue([])

  // School for notification language
  vi.mocked(db.school.findFirst).mockResolvedValue({
    preferredLanguage: "ar",
  } as any)
  vi.mocked(db.school.findUnique).mockResolvedValue({
    name: "Test School",
    address: "123 Test St",
    currency: "SAR",
  } as any)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("confirmEnrollment - notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("dispatches fee_due notification after fee assignments are created", async () => {
    setupEnrollmentMocks({
      feeStructures: [
        { name: "Tuition", totalAmount: "500.00" },
        { name: "Books", totalAmount: "300.00" },
      ],
      pendingFees: [{ finalAmount: "500.00" }, { finalAmount: "300.00" }],
    })

    const result = await confirmEnrollment({ id: APP_ID })

    expect(result.success).toBe(true)

    // Verify dispatchNotification was called with fee_due type
    const notifCalls = vi.mocked(dispatchNotification).mock.calls
    const feeDueCall = notifCalls.find(
      (call) => (call[0] as any).type === "fee_due"
    )

    expect(feeDueCall).toBeDefined()
    const feeNotif = feeDueCall![0] as any
    expect(feeNotif.type).toBe("fee_due")
    expect(feeNotif.schoolId).toBe(SCHOOL_ID)
    expect(feeNotif.userId).toBe(APPLICANT_USER_ID)
    expect(feeNotif.priority).toBe("high")
    expect(feeNotif.metadata.feeCount).toBe(2)
    expect(feeNotif.metadata.totalAmount).toBe(800)
  })

  it("dispatches guardian notifications after enrollment", async () => {
    setupEnrollmentMocks({
      guardianLinks: [
        { userId: "guardian-user-1" },
        { userId: "guardian-user-2" },
      ],
    })

    const result = await confirmEnrollment({ id: APP_ID })

    expect(result.success).toBe(true)

    // Verify dispatchNotification was called for each guardian
    const notifCalls = vi.mocked(dispatchNotification).mock.calls
    const guardianCalls = notifCalls.filter((call) => {
      const arg = call[0] as any
      return (
        arg.type === "account_created" &&
        (arg.userId === "guardian-user-1" || arg.userId === "guardian-user-2")
      )
    })

    expect(guardianCalls.length).toBe(2)

    const guardianUserIds = guardianCalls.map((c) => (c[0] as any).userId)
    expect(guardianUserIds).toContain("guardian-user-1")
    expect(guardianUserIds).toContain("guardian-user-2")
  })

  it("enrollment succeeds even when fee notification fails", async () => {
    setupEnrollmentMocks({
      feeStructures: [{ name: "Tuition", totalAmount: "500.00" }],
      pendingFees: [{ finalAmount: "500.00" }],
    })

    // Make dispatchNotification reject for fee_due calls but resolve for others
    vi.mocked(dispatchNotification).mockImplementation(async (args: any) => {
      if (args.type === "fee_due") {
        throw new Error("Notification service unavailable")
      }
      return "notif-ok"
    })

    // confirmEnrollment should still return success because fee notification
    // is non-fatal (caught by try/catch and .catch())
    const result = await confirmEnrollment({ id: APP_ID })

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty("studentId")
  })

  it("does not dispatch fee notification when no fees assigned", async () => {
    setupEnrollmentMocks({
      feeStructures: [],
      pendingFees: [],
    })

    const result = await confirmEnrollment({ id: APP_ID })

    expect(result.success).toBe(true)

    // Verify dispatchNotification was NOT called with fee_due
    const notifCalls = vi.mocked(dispatchNotification).mock.calls
    const feeDueCalls = notifCalls.filter(
      (call) => (call[0] as any).type === "fee_due"
    )

    expect(feeDueCalls.length).toBe(0)
  })
})
