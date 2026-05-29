// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    feeAssignment: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    school: {
      findFirst: vi.fn(),
    },
    payment: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    userInvoice: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    studentGuardian: {
      findMany: vi.fn(),
    },
    // P2.1 — markPaymentCleared wraps the status transition + assignment
    // status flip in $transaction to keep the two writes atomic. Mock just
    // resolves the array so the action under test doesn't blow up at the
    // txn boundary.
    $transaction: vi.fn().mockImplementation(async (ops) => ops),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue("notif-1"),
}))

vi.mock("../../lib/permissions", () => ({
  checkCurrentUserPermission: vi.fn(),
}))

vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn().mockResolvedValue({
    finance: {
      notifications: {
        paymentReceivedTitle: "Payment received",
        paymentRecordedStudentFull: "Payment of {amount} recorded.",
      },
    },
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("../queries", async () => ({
  calculateSiblingDiscount: vi.fn(),
  getFeeAssignmentList: vi.fn(),
  getFineList: vi.fn(),
  getPaymentList: vi.fn(),
  getScholarshipList: vi.fn(),
}))

// Provider: stub at module level. P0.4 added `resolveAvailableMethods` to
// the import surface so we need to keep the mock in lockstep — without it
// `createFeePaymentCheckout` throws "is not a function" before hitting
// `createPaymentCheckout`.
vi.mock("@/lib/payment/provider", () => ({
  createPaymentCheckout: vi.fn(),
  resolveAvailableMethods: vi.fn().mockReturnValue(["stripe"]),
}))

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-1"
const SUBDOMAIN = "demo"
const FEE_ASSIGNMENT_ID = "fa-1"
const STUDENT_ID = "stu-1"
const USER_ID = "user-1"
const LANG = "en"

async function setupAuthAndTenant(opts: { allowed?: boolean } = {}) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    requestId: "req-1",
    role: "ADMIN" as never,
    isPlatformAdmin: false,
  })
  const { checkCurrentUserPermission } = await import("../../lib/permissions")
  vi.mocked(checkCurrentUserPermission).mockResolvedValue(opts.allowed ?? true)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("fees/actions.ts — buildTenantBaseUrl", () => {
  it("uses subdomain.databayt.org host in production", async () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = "production"
    const { buildTenantBaseUrl } = await import("../tenant-url")
    expect(buildTenantBaseUrl("acme")).toBe("https://acme.databayt.org")
    if (original) process.env.NODE_ENV = original
  })

  it("uses subdomain.localhost:3000 host in development", async () => {
    const original = process.env.NODE_ENV
    process.env.NODE_ENV = "development"
    vi.resetModules() // re-import to pick up new NODE_ENV
    const { buildTenantBaseUrl } = await import("../tenant-url")
    expect(buildTenantBaseUrl("acme")).toBe("http://acme.localhost:3000")
    if (original) process.env.NODE_ENV = original
  })

  it("falls back to NEXT_PUBLIC_APP_URL when subdomain is missing", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = "https://app.databayt.org"
    vi.resetModules()
    const { buildTenantBaseUrl } = await import("../tenant-url")
    expect(buildTenantBaseUrl(null)).toBe("https://app.databayt.org")
    expect(buildTenantBaseUrl(undefined)).toBe("https://app.databayt.org")
    expect(buildTenantBaseUrl("")).toBe("https://app.databayt.org")
    if (originalUrl) process.env.NEXT_PUBLIC_APP_URL = originalUrl
    else delete process.env.NEXT_PUBLIC_APP_URL
  })
})

describe("createFeePaymentCheckout", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    await setupAuthAndTenant()
  })

  it("returns NOT_AUTHENTICATED when no session", async () => {
    const { auth } = await import("@/auth")
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    const { createFeePaymentCheckout } = await import("../actions")

    const result = await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(result.success).toBe(false)
    expect(result.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns MISSING_SCHOOL when no tenant context", async () => {
    vi.mocked(getTenantContext).mockResolvedValueOnce({
      schoolId: null,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    })
    const { createFeePaymentCheckout } = await import("../actions")

    const result = await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(result.success).toBe(false)
    expect(result.error).toBe("MISSING_SCHOOL")
  })

  it("returns UNAUTHORIZED when permission check fails", async () => {
    await setupAuthAndTenant({ allowed: false })
    const { createFeePaymentCheckout } = await import("../actions")

    const result = await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(result.success).toBe(false)
    expect(result.error).toBe("UNAUTHORIZED")
  })

  it("returns NOT_FOUND when fee assignment is missing", async () => {
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue(null)
    const { createFeePaymentCheckout } = await import("../actions")

    const result = await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(result.success).toBe(false)
    expect(result.error).toBe("NOT_FOUND")
  })

  it("returns FEE_FULLY_PAID when finalAmount is already covered", async () => {
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      finalAmount: 1000,
      academicYear: "2025-26",
      payments: [{ amount: 1000 }],
      student: { id: STUDENT_ID, firstName: "Ada", lastName: "Lovelace" },
      feeStructure: { name: "Tuition Q1" },
    } as never)
    const { createFeePaymentCheckout } = await import("../actions")

    const result = await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(result.success).toBe(false)
    expect(result.error).toBe("FEE_FULLY_PAID")
  })

  it("scopes feeAssignment lookup by schoolId for tenant isolation", async () => {
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      finalAmount: 1000,
      academicYear: "2025-26",
      payments: [],
      student: { id: STUDENT_ID, firstName: "Ada", lastName: "Lovelace" },
      feeStructure: { name: "Tuition Q1" },
    } as never)
    vi.mocked(db.school.findFirst).mockResolvedValue({
      currency: "USD",
      name: "Demo",
      domain: SUBDOMAIN,
    } as never)
    const { createPaymentCheckout } = await import("@/lib/payment/provider")
    vi.mocked(createPaymentCheckout).mockResolvedValue({
      success: true,
      gateway: "stripe",
      referenceNumber: "FEE-X",
      checkoutUrl: "https://checkout.stripe.com/x",
    } as never)
    const { createFeePaymentCheckout } = await import("../actions")

    await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(db.feeAssignment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FEE_ASSIGNMENT_ID, schoolId: SCHOOL_ID },
      })
    )
  })

  it("uses subdomain-aware base URL for success/cancel redirects", async () => {
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      finalAmount: 1000,
      academicYear: "2025-26",
      payments: [],
      student: { id: STUDENT_ID, firstName: "Ada", lastName: "Lovelace" },
      feeStructure: { name: "Tuition Q1" },
    } as never)
    vi.mocked(db.school.findFirst).mockResolvedValue({
      currency: "USD",
      name: "Demo",
      domain: SUBDOMAIN,
    } as never)
    const { createPaymentCheckout } = await import("@/lib/payment/provider")
    vi.mocked(createPaymentCheckout).mockResolvedValue({
      success: true,
      gateway: "stripe",
      referenceNumber: "FEE-X",
      checkoutUrl: "https://checkout.stripe.com/x",
    } as never)
    const { createFeePaymentCheckout } = await import("../actions")

    await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    const args = vi.mocked(createPaymentCheckout).mock.calls[0]?.[1] as {
      successUrl: string
      cancelUrl: string
    }
    expect(args.successUrl).toContain(SUBDOMAIN)
    expect(args.successUrl).toContain("payment=success")
    expect(args.cancelUrl).toContain("payment=cancelled")
  })

  it("passes correct metadata so the webhook can route the event", async () => {
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      finalAmount: 1000,
      academicYear: "2025-26",
      payments: [],
      student: { id: STUDENT_ID, firstName: "Ada", lastName: "Lovelace" },
      feeStructure: { name: "Tuition Q1" },
    } as never)
    vi.mocked(db.school.findFirst).mockResolvedValue({
      currency: "SAR",
      name: "Demo",
      domain: SUBDOMAIN,
    } as never)
    const { createPaymentCheckout } = await import("@/lib/payment/provider")
    vi.mocked(createPaymentCheckout).mockResolvedValue({
      success: true,
      gateway: "stripe",
      referenceNumber: "FEE-X",
      checkoutUrl: "https://checkout.stripe.com/x",
    } as never)
    const { createFeePaymentCheckout } = await import("../actions")

    await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(createPaymentCheckout).toHaveBeenCalledWith(
      "stripe",
      expect.objectContaining({
        amount: 1000,
        currency: "SAR",
        context: "school_fee",
        schoolId: SCHOOL_ID,
        referenceId: FEE_ASSIGNMENT_ID,
        metadata: expect.objectContaining({
          type: "fee_payment",
          feeAssignmentId: FEE_ASSIGNMENT_ID,
          studentId: STUDENT_ID,
          schoolId: SCHOOL_ID,
        }),
      })
    )
  })

  it("returns PAYMENT_FAILED when provider checkout fails", async () => {
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      finalAmount: 1000,
      academicYear: "2025-26",
      payments: [],
      student: { id: STUDENT_ID, firstName: "Ada", lastName: "Lovelace" },
      feeStructure: { name: "Tuition Q1" },
    } as never)
    vi.mocked(db.school.findFirst).mockResolvedValue({
      currency: "USD",
      name: "Demo",
      domain: SUBDOMAIN,
    } as never)
    const { createPaymentCheckout } = await import("@/lib/payment/provider")
    vi.mocked(createPaymentCheckout).mockResolvedValue({
      success: false,
      gateway: "stripe",
      referenceNumber: "FEE-X",
      error: "stripe down",
    } as never)
    const { createFeePaymentCheckout } = await import("../actions")

    const result = await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(result.success).toBe(false)
    expect(result.error).toBe("PAYMENT_FAILED")
  })

  it("succeeds and returns checkoutUrl on happy path", async () => {
    vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
      id: FEE_ASSIGNMENT_ID,
      schoolId: SCHOOL_ID,
      studentId: STUDENT_ID,
      finalAmount: 1000,
      academicYear: "2025-26",
      payments: [{ amount: 250 }],
      student: { id: STUDENT_ID, firstName: "Ada", lastName: "Lovelace" },
      feeStructure: { name: "Tuition Q1" },
    } as never)
    vi.mocked(db.school.findFirst).mockResolvedValue({
      currency: "USD",
      name: "Demo",
      domain: SUBDOMAIN,
    } as never)
    const { createPaymentCheckout } = await import("@/lib/payment/provider")
    vi.mocked(createPaymentCheckout).mockResolvedValue({
      success: true,
      gateway: "stripe",
      referenceNumber: "FEE-X",
      checkoutUrl: "https://checkout.stripe.com/sess",
    } as never)
    const { createFeePaymentCheckout } = await import("../actions")

    const result = await createFeePaymentCheckout(FEE_ASSIGNMENT_ID, LANG)

    expect(result.success).toBe(true)
    expect(result.data?.checkoutUrl).toBe("https://checkout.stripe.com/sess")
    // Charge only the unpaid balance: 1000 - 250 = 750
    expect(createPaymentCheckout).toHaveBeenCalledWith(
      "stripe",
      expect.objectContaining({ amount: 750 })
    )
  })
})

// ---------------------------------------------------------------------------
// P2.1 — markPaymentCleared (offline bank-transfer / ATM-deposit reconciliation)
// ---------------------------------------------------------------------------

describe("markPaymentCleared", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()
    await setupAuthAndTenant()
  })

  it("is idempotent — repeated clear on an already-SUCCESS row is a no-op", async () => {
    const PAYMENT_ID = "pay-1"
    vi.mocked(db.payment.findFirst).mockResolvedValue({
      id: PAYMENT_ID,
      status: "SUCCESS",
      amount: 500,
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date(),
      studentId: STUDENT_ID,
      feeAssignmentId: FEE_ASSIGNMENT_ID,
      feeAssignment: {
        finalAmount: 1000,
        payments: [{ amount: 500 }],
      },
    } as never)

    const { markPaymentCleared } = await import("../actions")
    const result = await markPaymentCleared(PAYMENT_ID)

    expect(result.success).toBe(true)
    expect(result.data).toBe(PAYMENT_ID)
    // The action returns early before any writes — guards against
    // double-posting to the ledger when an admin clicks twice.
    expect(db.payment.update).not.toHaveBeenCalled()
    expect(db.feeAssignment.update).not.toHaveBeenCalled()
  })

  it("returns PAYMENT_FAILED when the payment is in an unexpected state", async () => {
    // Only PENDING_VERIFICATION → SUCCESS is a legal transition. A FAILED
    // or CANCELLED payment can't be "cleared" — admin must record a new
    // entry.
    vi.mocked(db.payment.findFirst).mockResolvedValue({
      id: "pay-failed",
      status: "FAILED",
      amount: 500,
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date(),
      studentId: STUDENT_ID,
      feeAssignmentId: FEE_ASSIGNMENT_ID,
      feeAssignment: { finalAmount: 1000, payments: [] },
    } as never)

    const { markPaymentCleared } = await import("../actions")
    const result = await markPaymentCleared("pay-failed")

    expect(result.success).toBe(false)
    expect(result.error).toBe("PAYMENT_FAILED")
    expect(db.payment.update).not.toHaveBeenCalled()
  })

  it("transitions PENDING_VERIFICATION → SUCCESS and flips the assignment status", async () => {
    const PAYMENT_ID = "pay-pending"
    vi.mocked(db.payment.findFirst).mockResolvedValue({
      id: PAYMENT_ID,
      status: "PENDING_VERIFICATION",
      amount: 1000,
      paymentMethod: "BANK_TRANSFER",
      paymentDate: new Date(),
      studentId: STUDENT_ID,
      feeAssignmentId: FEE_ASSIGNMENT_ID,
      feeAssignment: {
        // Final 1000, no prior SUCCESS payments → clearing 1000 should
        // flip the assignment to PAID.
        finalAmount: 1000,
        payments: [],
      },
    } as never)
    vi.mocked(db.student.findFirst).mockResolvedValue({
      userId: USER_ID,
    } as never)
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([])

    const { markPaymentCleared } = await import("../actions")
    const result = await markPaymentCleared(PAYMENT_ID)

    expect(result.success).toBe(true)
    // Two writes: the Payment row and the FeeAssignment row — bundled in
    // $transaction so trial balance never sees a SUCCESS payment whose
    // parent is still PENDING.
    expect(db.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PAYMENT_ID },
        data: expect.objectContaining({
          status: "SUCCESS",
          verifiedBy: expect.any(String),
          verifiedAt: expect.any(Date),
        }),
      })
    )
    expect(db.feeAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: FEE_ASSIGNMENT_ID },
        data: { status: "PAID" },
      })
    )
  })

  it("returns NOT_FOUND when the payment doesn't exist (or belongs to a different tenant)", async () => {
    // Scoped lookup means cross-tenant probes hit this branch — the same
    // shape as an admin clicking a stale link.
    vi.mocked(db.payment.findFirst).mockResolvedValue(null)

    const { markPaymentCleared } = await import("../actions")
    const result = await markPaymentCleared("does-not-exist")

    expect(result.success).toBe(false)
    expect(result.error).toBe("NOT_FOUND")
  })
})
