// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Payer-side manual-rail submission (Bankak / Cashi).
 *
 * Covers the server chain that browser QA could not reach: the local dev origin
 * `http://demo.localhost:3000` is not in the S3 bucket's CORS allowlist (which
 * has `http://localhost:3000`, not a `*.localhost` wildcard), so the receipt PUT
 * is preflight-rejected before `submitManualPaymentProof` is ever called.
 * Production origins (`https://<school>.databayt.org`) match `https://*.databayt.org`
 * and are unaffected.
 */

import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { checkCurrentUserPermission } from "@/components/school-dashboard/finance/lib/permissions"

const SCHOOL_ID = "school-1"
const ASSIGNMENT_ID = "fa-1"
const STUDENT_ID = "stu-1"
const PROOF_URL = "https://cdn.databayt.org/payment-proof/school-1/fa-1/x.png"

vi.mock("@/lib/db", () => ({
  db: {
    feeAssignment: { findFirst: vi.fn() },
    // payment.findFirst backs generateUniquePaymentNumber/ReceiptNumber's
    // collision retry; create is the row under test.
    payment: { create: vi.fn(), findFirst: vi.fn().mockResolvedValue(null) },
    school: { findUnique: vi.fn() },
    // userOwnsAssignment reads student (STUDENT path) then guardian (GUARDIAN path).
    student: { findFirst: vi.fn() },
    guardian: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/components/school-dashboard/finance/lib/permissions", () => ({
  checkCurrentUserPermission: vi.fn(),
}))
vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue("n1"),
  dispatchNotificationsToAudience: vi.fn().mockResolvedValue({ created: 1 }),
}))
vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn().mockResolvedValue({ finance: { notifications: {} } }),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const createProcessingJob = vi.fn().mockResolvedValue({ id: "job-1" })
vi.mock("@/lib/document-extraction/queue-runner", () => ({
  createProcessingJob: (...args: unknown[]) => createProcessingJob(...args),
}))

const { auth } = await import("@/auth")

async function loadAction() {
  const mod = await import("@/components/school-dashboard/finance/fees/actions")
  return mod.submitManualPaymentProof
}

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    feeAssignmentId: ASSIGNMENT_ID,
    gateway: "bankak",
    bankReference: "BOK99120347",
    proofUrl: PROOF_URL,
    amount: 28000,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    user: { id: "user-1", role: "GUARDIAN" },
  })
  ;(getTenantContext as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
    schoolId: SCHOOL_ID,
  })
  // Parent, not staff — the whole point of this action.
  ;(
    checkCurrentUserPermission as unknown as ReturnType<typeof vi.fn>
  ).mockResolvedValue(false)
  ;(db.feeAssignment.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: ASSIGNMENT_ID,
    studentId: STUDENT_ID,
    currency: "SDG",
  })
  ;(db.school.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
    preferredLanguage: "ar",
  })
  ;(db.payment.create as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "pay-1",
  })
  ;(db.payment.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  // Ownership: not the student themselves...
  ;(db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
    userId: "someone-else",
  })
  // ...but a guardian linked to them.
  ;(db.guardian.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: "guardian-1",
  })
})

describe("submitManualPaymentProof", () => {
  it("creates a PENDING_VERIFICATION payment tagged with the wallet rail", async () => {
    const submit = await loadAction()
    const result = await submit(validInput())

    expect(result.success).toBe(true)
    const data = (db.payment.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0].data

    // Never lands as SUCCESS — a human clears it via markPaymentCleared.
    expect(data.status).toBe("PENDING_VERIFICATION")
    // Coarse enum bucket + real rail identity on gatewayMethod (Tap's pattern).
    expect(data.paymentMethod).toBe("BANK_TRANSFER")
    expect(data.gatewayMethod).toBe("bankak")
    // The bank's reference is what the replay guard keys on.
    expect(data.transactionId).toBe("BOK99120347")
    expect(data.depositSlipUrl).toBe(PROOF_URL)
    expect(data.schoolId).toBe(SCHOOL_ID)
  })

  it("tags cashi submissions distinctly so finance can split the rails", async () => {
    const submit = await loadAction()
    await submit(validInput({ gateway: "cashi" }))

    const data = (db.payment.create as ReturnType<typeof vi.fn>).mock
      .calls[0][0].data
    expect(data.gatewayMethod).toBe("cashi")
    expect(data.paymentMethod).toBe("BANK_TRANSFER")
  })

  it("maps the unique-constraint violation to PAYMENT_REFERENCE_ALREADY_USED", async () => {
    // @@unique([schoolId, transactionId]) — the same bank reference cannot be
    // claimed twice, whether that's a double-submit or a reused receipt.
    ;(db.payment.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.0.0",
      })
    )

    const submit = await loadAction()
    const result = await submit(validInput())

    expect(result.success).toBe(false)
    expect(result.error).toBe("PAYMENT_REFERENCE_ALREADY_USED")
  })

  it("refuses a non-owner without revealing whether the assignment exists", async () => {
    // Neither the student themselves nor a guardian linked to them.
    ;(db.student.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(db.guardian.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const submit = await loadAction()
    const result = await submit(validInput())

    expect(result.success).toBe(false)
    expect(result.error).toBe("UNAUTHORIZED")
    expect(db.payment.create).not.toHaveBeenCalled()
  })

  it("returns UNAUTHORIZED (not NOT_FOUND) for a missing assignment, so ids can't be probed", async () => {
    ;(db.feeAssignment.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(
      null
    )

    const submit = await loadAction()
    const result = await submit(validInput())

    expect(result.success).toBe(false)
    expect(result.error).toBe("UNAUTHORIZED")
  })

  it("rejects an unauthenticated caller", async () => {
    ;(auth as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    const submit = await loadAction()
    const result = await submit(validInput())

    expect(result.success).toBe(false)
    expect(result.error).toBe("NOT_AUTHENTICATED")
    expect(db.payment.create).not.toHaveBeenCalled()
  })

  it("validates input rather than trusting the client", async () => {
    const submit = await loadAction()

    for (const bad of [
      validInput({ gateway: "stripe" }), // not a manual rail
      validInput({ proofUrl: "not-a-url" }),
      validInput({ amount: -5 }),
      validInput({ bankReference: "" }),
    ]) {
      const result = await submit(bad)
      expect(result.success).toBe(false)
      expect(result.error).toBe("VALIDATION_ERROR")
    }
    expect(db.payment.create).not.toHaveBeenCalled()
  })

  it("queues the receipt for AI extraction on the existing bank_receipt handler", async () => {
    const submit = await loadAction()
    await submit(validInput())

    expect(createProcessingJob).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: SCHOOL_ID,
        jobType: "bank_receipt",
        fileUrl: PROOF_URL,
        metadata: expect.objectContaining({ paymentId: "pay-1" }),
      })
    )
  })

  it("still records the payment when the AI queue fails", async () => {
    // A broken extraction queue must never lose a parent's submission — the
    // bursar can always verify the image by eye.
    createProcessingJob.mockRejectedValueOnce(new Error("queue down"))

    const submit = await loadAction()
    const result = await submit(validInput())

    expect(result.success).toBe(true)
    expect(db.payment.create).toHaveBeenCalled()
  })
})
