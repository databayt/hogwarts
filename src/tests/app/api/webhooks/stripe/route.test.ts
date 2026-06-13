// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"
// Import the handler after mocks
import { POST } from "@/app/api/webhooks/stripe/route"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    feeAssignment: { findFirst: vi.fn(), update: vi.fn() },
    payment: { create: vi.fn(), updateMany: vi.fn() },
    userInvoice: { findMany: vi.fn(), update: vi.fn() },
    student: { findFirst: vi.fn() },
    user: {
      update: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
    subscription: { upsert: vi.fn(), updateMany: vi.fn() },
    enrollment: { update: vi.fn() },
    streamEnrollment: { update: vi.fn(), deleteMany: vi.fn() },
    videoPurchase: { upsert: vi.fn() },
    invoice: { upsert: vi.fn() },
    // Dedupe ledger written before branch processing (idempotency).
    processedWebhookEvent: {
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue("test-signature"),
  }),
}))

vi.mock("@/components/saas-marketing/pricing/lib/stripe", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    subscriptions: {
      retrieve: vi.fn(),
    },
  },
}))

vi.mock("@/components/saas-marketing/pricing/lib/get-tier-id", () => ({
  getTierIdFromStripePrice: vi.fn().mockResolvedValue("tier-basic"),
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue("notif-1"),
  resolveSchoolLang: vi.fn().mockResolvedValue("ar"),
}))

vi.mock("@/components/school-dashboard/finance/lib/accounting/actions", () => ({
  postFeePayment: vi.fn().mockResolvedValue({ success: true }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: string = "raw-body"): Request {
  return new Request("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    body,
    headers: {
      "Stripe-Signature": "test-signature",
    },
  })
}

function makeCheckoutEvent(
  metadata: Record<string, string> = {},
  overrides: Record<string, unknown> = {}
) {
  return {
    id: "evt_test_123",
    type: "checkout.session.completed",
    data: {
      object: {
        metadata,
        payment_status: "paid",
        payment_intent: "pi_test_123",
        subscription: undefined,
        ...overrides,
      },
    },
  }
}

function makeExpiredCheckoutEvent(
  metadata: Record<string, string> = {},
  overrides: Record<string, unknown> = {}
) {
  return {
    id: "evt_expired_123",
    type: "checkout.session.expired",
    data: {
      object: {
        id: "cs_expired_123",
        metadata,
        ...overrides,
      },
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Stripe Webhook - POST handler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    // Default: dedupe insert succeeds (event not already processed)
    vi.mocked(db.processedWebhookEvent.create).mockResolvedValue({} as never)
  })

  // =========================================================================
  // Signature verification
  // =========================================================================

  describe("signature verification", () => {
    it("returns 400 when signature verification fails", async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockImplementation(() => {
        throw new Error("Invalid signature")
      })

      const response = await POST(makeRequest())

      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toContain("Webhook Error")
      expect(text).toContain("Invalid signature")
    })

    it("returns 400 with non-Error thrown by constructEvent", async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockImplementation(() => {
        throw "string-error"
      })

      const response = await POST(makeRequest())

      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toContain("string-error")
    })
  })

  // =========================================================================
  // Application fee payment
  // =========================================================================

  describe("application fee payment", () => {
    it("updates application and sends fee_paid notification", async () => {
      const event = makeCheckoutEvent({
        type: "application_fee",
        applicationId: "app-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.findFirst)
        // idempotency check
        .mockResolvedValueOnce({ applicationFeePaid: false } as never)
        // notification fetch
        .mockResolvedValueOnce({
          userId: "u1",
          applicationNumber: "APP-2026-ABC",
          schoolId: "s1",
        } as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            applicationFeePaid: true,
            paymentId: "pi_test_123",
          }),
        })
      )
    })

    it("returns 200 even if notification dispatch fails", async () => {
      const event = makeCheckoutEvent({
        type: "application_fee",
        applicationId: "app-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.findFirst)
        .mockResolvedValueOnce({ applicationFeePaid: false } as never)
        .mockRejectedValueOnce(new Error("Notification system down"))
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      // Should still return 200 because notification failure is non-fatal
      expect(response.status).toBe(200)
    })

    it("does not send notification when no userId on application", async () => {
      const event = makeCheckoutEvent({
        type: "application_fee",
        applicationId: "app-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.findFirst)
        .mockResolvedValueOnce({ applicationFeePaid: false } as never)
        .mockResolvedValueOnce({
          userId: null,
          applicationNumber: "APP-2026-ABC",
          schoolId: "s1",
        } as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.application.findFirst).toHaveBeenCalled()
    })

    it("does not update application when payment_status is not paid", async () => {
      const event = makeCheckoutEvent(
        { type: "application_fee", applicationId: "app-1" },
        { payment_status: "unpaid" }
      )
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.application.update).not.toHaveBeenCalled()
    })

    it("STRIPE-FEE-CATCH-200: returns 5xx and releases dedupe when db.application.update throws", async () => {
      const event = makeCheckoutEvent({
        type: "application_fee",
        applicationId: "app-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.findFirst).mockResolvedValueOnce({
        applicationFeePaid: false,
      } as never)
      vi.mocked(db.application.update).mockRejectedValue(
        new Error("DB write failed")
      )

      const response = await POST(makeRequest())

      // Money path must NOT swallow failure with 200 — Stripe needs to retry.
      expect(response.status).toBeGreaterThanOrEqual(500)
      // The dedupe row must be removed so the retry is reprocessed, not skipped.
      expect(db.processedWebhookEvent.delete).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Registration fee payment
  // =========================================================================

  describe("registration fee payment", () => {
    it("updates registrationFeePaid and sends notification", async () => {
      const event = makeCheckoutEvent(
        {
          type: "registration_fee",
          applicationId: "app-reg-1",
          schoolId: "s1",
        },
        { id: "cs_reg_1", amount_total: 50000 }
      )
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.findFirst)
        .mockResolvedValueOnce({ registrationFeePaid: false } as never)
        .mockResolvedValueOnce({
          userId: "u1",
          applicationNumber: "APP-REG-001",
          schoolId: "s1",
        } as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            registrationFeePaid: true,
            registrationFeeAmount: 500, // amount_total / 100
            registrationFeeMethod: "stripe",
          }),
        })
      )
    })

    it("STRIPE-FEE-CATCH-200: returns 5xx and releases dedupe when registration fee DB write fails", async () => {
      const event = makeCheckoutEvent({
        type: "registration_fee",
        applicationId: "app-reg-1",
        schoolId: "s1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.findFirst).mockResolvedValueOnce({
        registrationFeePaid: false,
      } as never)
      vi.mocked(db.application.update).mockRejectedValue(
        new Error("DB write failed")
      )

      const response = await POST(makeRequest())

      expect(response.status).toBeGreaterThanOrEqual(500)
      expect(db.processedWebhookEvent.delete).toHaveBeenCalled()
    })

    it("skips if already registrationFeePaid (idempotency)", async () => {
      const event = makeCheckoutEvent({
        type: "registration_fee",
        applicationId: "app-reg-1",
        schoolId: "s1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.findFirst).mockResolvedValueOnce({
        registrationFeePaid: true,
      } as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.application.update).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Fee payment (school fee) — STRIPE-FEE-CATCH-200, INV-002
  // =========================================================================

  describe("fee payment (school fee)", () => {
    const baseMeta = {
      type: "fee_payment",
      feeAssignmentId: "fa-1",
      schoolId: "s1",
      studentId: "st-1",
    }

    function mockFeeAssignment(
      overrides: Partial<{
        finalAmount: number
        totalPaid: number
        currency: string
      }> = {}
    ) {
      const { finalAmount = 1000, totalPaid = 0, currency = "SAR" } = overrides
      vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
        id: "fa-1",
        schoolId: "s1",
        studentId: "st-1",
        finalAmount,
        currency,
        payments: Array.from({ length: totalPaid > 0 ? 1 : 0 }, () => ({
          amount: totalPaid,
        })),
        student: {
          userId: "u-student-1",
          firstName: "Ali",
          lastName: "Hassan",
        },
        school: { currency: "SAR" },
      } as never)
    }

    it("records payment and sets PAID when fully covered", async () => {
      const event = makeCheckoutEvent(baseMeta)
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      mockFeeAssignment({ finalAmount: 1000, totalPaid: 0 })
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-1",
        receiptNumber: "RCP-ABCD1234",
        paymentDate: new Date(),
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.feeAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "PAID" } })
      )
    })

    it("STRIPE-FEE-CATCH-200: returns 5xx and releases dedupe when fee_payment DB write fails", async () => {
      const event = makeCheckoutEvent(baseMeta)
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.feeAssignment.findFirst).mockRejectedValue(
        new Error("DB read failed")
      )

      const response = await POST(makeRequest())

      expect(response.status).toBeGreaterThanOrEqual(500)
      expect(db.processedWebhookEvent.delete).toHaveBeenCalled()
    })

    it("INV-002: allocates payment across multiple invoices oldest-first", async () => {
      const event = makeCheckoutEvent(baseMeta)
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      // 1000 paid on a 1000 assignment — two invoices: 600 + 400
      mockFeeAssignment({ finalAmount: 1000, totalPaid: 0 })
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-1",
        receiptNumber: "RCP-ABCD1234",
        paymentDate: new Date(),
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)

      const inv1 = {
        id: "inv-1",
        total: 600,
        amountPaid: 0,
        status: "UNPAID",
        due_date: new Date("2026-01-01"),
      }
      const inv2 = {
        id: "inv-2",
        total: 400,
        amountPaid: 0,
        status: "UNPAID",
        due_date: new Date("2026-02-01"),
      }
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([
        inv1,
        inv2,
      ] as never)
      vi.mocked(db.userInvoice.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      // First invoice fully covered (600): PAID + amountPaid=600
      expect(db.userInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: { amountPaid: 600, status: "PAID" },
        })
      )
      // Second invoice fully covered (400): PAID + amountPaid=400
      expect(db.userInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-2" },
          data: { amountPaid: 400, status: "PAID" },
        })
      )
    })

    it("INV-002: sets PARTIAL status when only one invoice partially covered", async () => {
      const event = makeCheckoutEvent(baseMeta)
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      // 500 paid on 1000 assignment — only partially covers first 600 invoice
      mockFeeAssignment({ finalAmount: 1000, totalPaid: 500 })
      // Remaining = 500
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-1",
        receiptNumber: "RCP-ABCD1234",
        paymentDate: new Date(),
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)

      const inv1 = {
        id: "inv-1",
        total: 600,
        amountPaid: 0,
        status: "UNPAID",
        due_date: new Date("2026-01-01"),
      }
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([inv1] as never)
      vi.mocked(db.userInvoice.update).mockResolvedValue({} as never)

      await POST(makeRequest())

      // 500 applied to 600 invoice → PARTIAL
      expect(db.userInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: { amountPaid: 500, status: "PARTIAL" },
        })
      )
    })

    it("receipt URL in notification uses /api/payment/:id/receipt", async () => {
      const { dispatchNotification } =
        await import("@/lib/dispatch-notification")
      const event = makeCheckoutEvent(baseMeta)
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      mockFeeAssignment({ finalAmount: 500, totalPaid: 0 })
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-xyz",
        receiptNumber: "RCP-ABCD1234",
        paymentDate: new Date(),
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])

      await POST(makeRequest())

      expect(dispatchNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            url: `/api/payment/pay-xyz/receipt`,
          }),
        })
      )
    })
  })

  // =========================================================================
  // Catalog enrollment payment
  // =========================================================================

  describe("catalog enrollment payment", () => {
    it("activates enrollment on successful payment", async () => {
      const event = makeCheckoutEvent({
        type: "catalog_enrollment",
        catalogSubjectId: "subj-1",
        enrollmentId: "enr-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.enrollment.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.enrollment.update).toHaveBeenCalledWith({
        where: { id: "enr-1" },
        data: {
          isActive: true,
          status: "ACTIVE",
          updatedAt: expect.any(Date),
        },
      })
    })
  })

  // =========================================================================
  // Video purchase payment — the ONLY point that unlocks paid lesson videos
  // =========================================================================

  describe("video purchase payment", () => {
    it("flips VideoPurchase to SUCCESS on paid checkout", async () => {
      const event = makeCheckoutEvent(
        {
          type: "video_purchase",
          videoId: "vid-1",
          userId: "user-1",
          schoolId: "school-1",
        },
        { id: "cs_vid_1", amount_total: 1999, currency: "usd" }
      )
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.videoPurchase.upsert).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.videoPurchase.upsert).toHaveBeenCalledWith({
        where: {
          userId_videoId: { userId: "user-1", videoId: "vid-1" },
        },
        update: {
          status: "SUCCESS",
          stripeSessionId: "cs_vid_1",
        },
        create: {
          userId: "user-1",
          videoId: "vid-1",
          schoolId: "school-1",
          amount: 19.99, // amount_total cents / 100
          currency: "USD", // uppercased
          stripeSessionId: "cs_vid_1",
          status: "SUCCESS",
        },
      })
    })

    it("does NOT unlock when payment_status is not paid", async () => {
      const event = makeCheckoutEvent(
        { type: "video_purchase", videoId: "vid-1", userId: "user-1" },
        { payment_status: "unpaid" }
      )
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.videoPurchase.upsert).not.toHaveBeenCalled()
    })

    it("does not run the branch when videoId or userId metadata is missing", async () => {
      const event = makeCheckoutEvent({
        type: "video_purchase",
        videoId: "vid-1",
        // userId intentionally omitted
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.videoPurchase.upsert).not.toHaveBeenCalled()
    })

    it("retries (non-2xx) and leaves no dedupe row when the upsert fails", async () => {
      const event = makeCheckoutEvent(
        {
          type: "video_purchase",
          videoId: "vid-1",
          userId: "user-1",
          schoolId: "school-1",
        },
        { id: "cs_vid_2", amount_total: 1999, currency: "usd" }
      )
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.videoPurchase.upsert).mockRejectedValue(
        new Error("DB write failed")
      )

      const response = await POST(makeRequest())

      // Money path must NOT swallow failure with 200 — Stripe needs to retry.
      expect(response.status).toBeGreaterThanOrEqual(500)
      // The dedupe row must be removed so the retry is reprocessed, not skipped.
      expect(db.processedWebhookEvent.delete).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Course enrollment payment
  // =========================================================================

  describe("course enrollment payment", () => {
    it("activates stream enrollment on successful payment", async () => {
      const event = makeCheckoutEvent({
        courseId: "course-1",
        enrollmentId: "enr-1",
        schoolId: "school-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.streamEnrollment.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.streamEnrollment.update).toHaveBeenCalledWith({
        where: {
          id: "enr-1",
          schoolId: "school-1",
        },
        data: {
          isActive: true,
          updatedAt: expect.any(Date),
        },
      })
    })
  })

  // =========================================================================
  // checkout.session.expired — CHECKOUT-STUCK-STATE
  // =========================================================================

  describe("checkout.session.expired", () => {
    it("cleans up pending course enrollment", async () => {
      const event = makeExpiredCheckoutEvent({
        courseId: "course-1",
        enrollmentId: "enr-1",
        schoolId: "school-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.streamEnrollment.deleteMany).mockResolvedValue({
        count: 1,
      } as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.streamEnrollment.deleteMany).toHaveBeenCalledWith({
        where: {
          id: "enr-1",
          schoolId: "school-1",
          isActive: false,
        },
      })
    })

    it("CHECKOUT-STUCK-STATE: clears registration_fee method fields so parent can retry", async () => {
      const event = makeExpiredCheckoutEvent({
        type: "registration_fee",
        applicationId: "app-1",
        schoolId: "s1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "app-1", schoolId: "s1" },
          data: {
            registrationFeeMethod: null,
            registrationFeeReference: null,
          },
        })
      )
    })

    it("CHECKOUT-STUCK-STATE: clears application_fee method fields (legacy)", async () => {
      const event = makeExpiredCheckoutEvent({
        type: "application_fee",
        applicationId: "app-2",
        schoolId: "s1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "app-2", schoolId: "s1" },
          data: { paymentMethod: null, paymentReference: null },
        })
      )
    })

    it("CHECKOUT-STUCK-STATE: does NOT touch paid flags when clearing stuck state", async () => {
      const event = makeExpiredCheckoutEvent({
        type: "registration_fee",
        applicationId: "app-3",
        schoolId: "s1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      await POST(makeRequest())

      const call = vi.mocked(db.application.update).mock.calls[0]
      // Must not include any paid flags
      expect(call[0].data).not.toHaveProperty("registrationFeePaid")
      expect(call[0].data).not.toHaveProperty("applicationFeePaid")
    })
  })

  // =========================================================================
  // payment_intent.payment_failed — PAYMENT-FAILED-HARDCODED-EN
  // =========================================================================

  describe("payment_intent.payment_failed", () => {
    it("PAYMENT-FAILED-HARDCODED-EN: dispatches notification using resolveSchoolLang", async () => {
      const { dispatchNotification, resolveSchoolLang } =
        await import("@/lib/dispatch-notification")
      const event = {
        id: "evt_pi_failed",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_fail_1",
            last_payment_error: {
              message: "Your card was declined.",
              code: "card_declined",
            },
            metadata: {
              schoolId: "s1",
              feeAssignmentId: "fa-1",
              studentId: "st-1",
              type: "fee_payment",
            },
          },
        },
      }
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        userId: "u-student-1",
      } as never)
      vi.mocked(resolveSchoolLang).mockResolvedValue("ar")

      await POST(makeRequest())

      expect(resolveSchoolLang).toHaveBeenCalledWith("s1")
      expect(dispatchNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          lang: "ar",
          title: "فشلت عملية الدفع",
        })
      )
    })

    it("PAYMENT-FAILED-HARDCODED-EN: uses English body when school lang is en", async () => {
      const { dispatchNotification, resolveSchoolLang } =
        await import("@/lib/dispatch-notification")
      const event = {
        id: "evt_pi_failed_en",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_fail_2",
            last_payment_error: { message: "Insufficient funds." },
            metadata: {
              schoolId: "s-en",
              feeAssignmentId: "fa-2",
              studentId: "st-2",
              type: "fee_payment",
            },
          },
        },
      }
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        userId: "u-student-2",
      } as never)
      vi.mocked(resolveSchoolLang).mockResolvedValue("en")

      await POST(makeRequest())

      expect(dispatchNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          lang: "en",
          title: "Payment Failed",
          body: expect.stringContaining("Insufficient funds."),
        })
      )
    })
  })

  // =========================================================================
  // STRIPE-DUPLICATE-HANDLERS: customer.subscription.updated — single handler
  // =========================================================================

  describe("customer.subscription.updated (de-duplicated)", () => {
    it("updates both Subscription and User tables in a single pass", async () => {
      const event = {
        id: "evt_sub_updated",
        type: "customer.subscription.updated",
        data: {
          object: {
            id: "sub_123",
            status: "active",
            current_period_end: 1800000000,
            cancel_at_period_end: false,
            items: { data: [{ price: { id: "price_pro" } }] },
          },
        },
      }
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.subscription.updateMany).mockResolvedValue({
        count: 1,
      } as never)
      vi.mocked(db.user.updateMany).mockResolvedValue({ count: 1 } as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.subscription.updateMany).toHaveBeenCalledTimes(1)
      expect(db.user.updateMany).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // STRIPE-DUPLICATE-HANDLERS: customer.subscription.deleted — single handler
  // =========================================================================

  describe("customer.subscription.deleted (de-duplicated)", () => {
    it("updates both Subscription and User tables in a single pass", async () => {
      const event = {
        id: "evt_sub_deleted",
        type: "customer.subscription.deleted",
        data: { object: { id: "sub_456" } },
      }
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.subscription.updateMany).mockResolvedValue({
        count: 1,
      } as never)
      vi.mocked(db.user.updateMany).mockResolvedValue({ count: 1 } as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.subscription.updateMany).toHaveBeenCalledTimes(1)
      expect(db.user.updateMany).toHaveBeenCalledTimes(1)
    })
  })

  // =========================================================================
  // STRIPE-DUPLICATE-HANDLERS: invoice.payment_failed — single handler
  // =========================================================================

  describe("invoice.payment_failed (de-duplicated, marks past_due)", () => {
    it("marks subscription past_due once", async () => {
      const event = {
        id: "evt_inv_failed",
        type: "invoice.payment_failed",
        data: {
          object: {
            id: "in_123",
            subscription: "sub_789",
          },
        },
      }
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.subscription.updateMany).mockResolvedValue({
        count: 1,
      } as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.subscription.updateMany).toHaveBeenCalledTimes(1)
      expect(db.subscription.updateMany).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_789" },
        data: { status: "past_due" },
      })
    })
  })

  // =========================================================================
  // receiptNumber format — R-P2-4
  // =========================================================================

  describe("receiptNumber / paymentNumber collision-safe generation", () => {
    it("receipt number uses RCP- prefix with 8 uppercase hex chars", async () => {
      const event = makeCheckoutEvent({
        type: "fee_payment",
        feeAssignmentId: "fa-receipt",
        schoolId: "s1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as never)
      vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
        id: "fa-receipt",
        schoolId: "s1",
        studentId: "st-1",
        finalAmount: 200,
        currency: "SAR",
        payments: [],
        student: { userId: "u1", firstName: "X", lastName: "Y" },
        school: { currency: "SAR" },
      } as never)
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-receipt",
        receiptNumber: "RCP-AABBCCDD",
        paymentDate: new Date(),
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])

      await POST(makeRequest())

      // The create call must use a receiptNumber matching RCP-XXXXXXXX
      const createCall = vi.mocked(db.payment.create).mock.calls[0][0]
      expect(createCall.data.receiptNumber).toMatch(/^RCP-[0-9A-F]{8}$/)
      expect(createCall.data.paymentNumber).toMatch(/^PAY-[0-9A-F]{8}$/)
      // Must NOT use Date.now() (no numeric suffix)
      expect(createCall.data.receiptNumber).not.toContain(
        String(Date.now()).substring(0, 6)
      )
    })
  })

  // =========================================================================
  // Unrecognized event types
  // =========================================================================

  describe("unrecognized events", () => {
    it("returns 200 for unhandled event types", async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue({
        id: "evt_unknown",
        type: "some.unknown.event",
        data: { object: {} },
      } as never)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
    })
  })
})
