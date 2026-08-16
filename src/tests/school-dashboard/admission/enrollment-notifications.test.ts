// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { dispatchNotification } from "@/lib/dispatch-notification"
import { confirmEnrollment } from "@/components/school-dashboard/admission/actions"

/**
 * `confirmEnrollment` hands its post-commit notification work to `after()`
 * (see `src/lib/student-provisioning-notify.ts`), so the dispatch no longer
 * completes within the action's own await chain — it is genuinely deferred.
 * The next/server test mock runs the `after()` callback inline but does not
 * await it, so drain the microtask queue before asserting on what was sent.
 */
const flushDeferredNotifications = async () => {
  // Several turns, not one: the chain awaits a school lookup and a dynamic
  // `import("@/components/auth/tokens")` before it dispatches anything. A
  // fixed budget of 10 turns proved flaky under load (1 in ~3 file runs), so
  // this is generous — it costs nothing when the chain finishes early.
  for (let i = 0; i < 40; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0))
  }
}

// ---------------------------------------------------------------------------
// Mocks — follows the same pattern as actions.test.ts
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    // The fee notice now also reports the instalment schedule and stamps
    // `UserInvoice.sentAt`, so the notify path reads invoices too.
    userInvoice: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
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
      count: vi.fn().mockResolvedValue(0),
    },
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({}),
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
      findFirst: vi.fn().mockResolvedValue(null),
    },
    studentDocument: {
      create: vi.fn(),
      findFirst: vi.fn().mockResolvedValue(null),
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

// confirmEnrollment dynamically imports this to mint a password-setup link
// for brand-new guest Users (no password set on create).
vi.mock("@/components/auth/tokens", () => ({
  generatePasswordResetToken: vi.fn().mockResolvedValue({
    email: "guest@test.com",
    token: "raw-reset-token-abc",
    expires: new Date(Date.now() + 3600 * 1000),
  }),
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

  // `vi.clearAllMocks()` clears calls but NOT implementations, so a test that
  // stubs a different resolved value would leak into the next one. Re-prime.
  vi.mocked(dispatchNotification).mockResolvedValue("notif-1")

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
  // Guest path (hasUserId: false): no existing user matches this email in
  // this school, so confirmEnrollment creates a brand-new guest User above.
  vi.mocked(db.user.findFirst).mockResolvedValue(null)

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

  // Invoices raised for those fee assignments (one per instalment).
  vi.mocked(db.userInvoice.findMany).mockResolvedValue([] as any)
  vi.mocked(db.userInvoice.updateMany).mockResolvedValue({ count: 0 } as any)

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
      guardian: {
        userId: link.userId ?? null,
        emailAddress: link.emailAddress ?? null,
      },
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

  it("does NOT stamp sentAt when the notice failed to dispatch", async () => {
    setupEnrollmentMocks({
      feeStructures: [{ name: "Tuition", totalAmount: "1000.00" }],
      pendingFees: [{ finalAmount: "1000.00" }],
    })
    vi.mocked(db.userInvoice.findMany).mockResolvedValue([
      { id: "inv-1" },
    ] as any)
    // dispatchNotification swallows its own errors and returns null. Stamping
    // anyway would mark invoices as "sent" that nobody was ever told about,
    // and the fee-due cron would then chase a family for an invoice they
    // never received.
    vi.mocked(dispatchNotification).mockResolvedValue(null)

    await confirmEnrollment({ id: APP_ID })
    await flushDeferredNotifications()

    expect(db.userInvoice.updateMany).not.toHaveBeenCalled()
  })

  it("stamps UserInvoice.sentAt once the family has actually been told", async () => {
    setupEnrollmentMocks({
      feeStructures: [{ name: "Tuition", totalAmount: "1000.00" }],
      pendingFees: [{ finalAmount: "1000.00" }],
    })
    vi.mocked(db.userInvoice.findMany).mockResolvedValue([
      { id: "inv-1" },
      { id: "inv-2" },
    ] as any)

    await confirmEnrollment({ id: APP_ID })
    await flushDeferredNotifications()

    // Before this, `sentAt` was stamped only by the manual admin "send
    // invoice" button — so an enrolled family was chased by the fee-due and
    // fee-overdue crons for invoices they had never been sent.
    expect(db.userInvoice.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["inv-1", "inv-2"] } },
      data: { sentAt: expect.any(Date) },
    })
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
    await flushDeferredNotifications()

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
    await flushDeferredNotifications()

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

  it("falls back to directEmail for a guardian with no linked account (userId null) but an email on file", async () => {
    // createOrLinkGuardian never sets a userId (guardians are contact
    // records, not accounts) — this is the normal shape for every
    // admission-created guardian, not an edge case.
    setupEnrollmentMocks({
      guardianLinks: [
        { userId: null, emailAddress: "guardian-no-account@test.com" },
      ],
    })

    const result = await confirmEnrollment({ id: APP_ID })
    await flushDeferredNotifications()

    expect(result.success).toBe(true)

    const notifCalls = vi.mocked(dispatchNotification).mock.calls
    const guardianEmailCall = notifCalls.find((call) => {
      const arg = call[0] as any
      return (
        arg.type === "account_created" &&
        arg.directEmail === "guardian-no-account@test.com"
      )
    })

    expect(guardianEmailCall).toBeDefined()
    const arg = guardianEmailCall![0] as any
    expect(arg.userId).toBeUndefined()
    expect(arg.channels).toEqual(["email"])
  })

  it("does not send the email channel when the school disabled autoEmailNotifications", async () => {
    setupEnrollmentMocks()
    vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
      autoEmailNotifications: false,
    } as any)

    const result = await confirmEnrollment({ id: APP_ID })
    await flushDeferredNotifications()

    expect(result.success).toBe(true)

    // The account_created enrollment-confirmation notification still fires
    // in-app, but must have dropped "email" from its channel list.
    const notifCalls = vi.mocked(dispatchNotification).mock.calls
    const enrollmentCall = notifCalls.find(
      (call) => (call[0] as any).type === "account_created"
    )
    expect(enrollmentCall).toBeDefined()
    const arg = enrollmentCall![0] as any
    expect(arg.channels).toEqual(["in_app"])
  })

  it("mints a password-setup link for a brand-new guest User (no existing account)", async () => {
    setupEnrollmentMocks({ hasUserId: false })

    const result = await confirmEnrollment({ id: APP_ID })
    await flushDeferredNotifications()

    expect(result.success).toBe(true)
    // Confirms the guest-creation branch actually ran.
    expect(db.user.create).toHaveBeenCalled()

    const { generatePasswordResetToken } =
      await import("@/components/auth/tokens")
    expect(generatePasswordResetToken).toHaveBeenCalledWith("ahmed@example.com")

    const notifCalls = vi.mocked(dispatchNotification).mock.calls
    const enrollmentCall = notifCalls.find(
      (call) => (call[0] as any).type === "account_created"
    )
    expect(enrollmentCall).toBeDefined()
    const arg = enrollmentCall![0] as any
    // The dead "/" link is replaced with an absolute password-setup URL so
    // the new guest student can actually authenticate for the first time.
    expect(arg.metadata.url).toContain("/new-password?token=")
    expect(arg.body).toContain("/new-password?token=")
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
    await flushDeferredNotifications()

    expect(result.success).toBe(true)
    expect(result.data).toHaveProperty("studentId")
  })

  /**
   * The post-commit dispatch was extracted out of confirmEnrollment into the
   * shared `notifyProvisionedStudent`. If the inline block were ever left in
   * place alongside the shared call, every PORTAL enrollment would silently
   * send everything twice — the exact regression this pins.
   */
  it("sends the student's account notice exactly once (no double-send after the extraction)", async () => {
    setupEnrollmentMocks()

    const result = await confirmEnrollment({ id: APP_ID })
    await flushDeferredNotifications()

    expect(result.success).toBe(true)

    const studentAccountNotices = vi
      .mocked(dispatchNotification)
      .mock.calls.filter((call) => {
        const arg = call[0] as any
        // The student's own notice, not a guardian's: guardians are addressed
        // by directEmail or their own userId.
        return (
          arg.type === "account_created" && arg.userId === APPLICANT_USER_ID
        )
      })

    expect(studentAccountNotices).toHaveLength(1)
  })

  it("does not dispatch fee notification when no fees assigned", async () => {
    setupEnrollmentMocks({
      feeStructures: [],
      pendingFees: [],
    })

    const result = await confirmEnrollment({ id: APP_ID })
    await flushDeferredNotifications()

    expect(result.success).toBe(true)

    // Verify dispatchNotification was NOT called with fee_due
    const notifCalls = vi.mocked(dispatchNotification).mock.calls
    const feeDueCalls = notifCalls.filter(
      (call) => (call[0] as any).type === "fee_due"
    )

    expect(feeDueCalls.length).toBe(0)
  })
})
