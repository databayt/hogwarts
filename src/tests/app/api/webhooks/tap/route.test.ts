// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { POST } from "@/app/api/webhooks/tap/route"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    feeAssignment: { findFirst: vi.fn(), update: vi.fn() },
    payment: { create: vi.fn() },
    userInvoice: { findMany: vi.fn(), update: vi.fn() },
    processedWebhookEvent: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue(undefined),
  resolveSchoolLang: vi.fn().mockResolvedValue("ar"),
}))

vi.mock("@/components/school-dashboard/finance/lib/accounting/actions", () => ({
  postFeePayment: vi.fn().mockResolvedValue({ success: true }),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a Tap CAPTURED charge payload with the given metadata. */
function makeCapturedCharge(
  context: string,
  meta: Record<string, string | undefined> = {},
  overrides: Record<string, unknown> = {}
) {
  return JSON.stringify({
    id: `ch_tap_${Math.random().toString(36).substring(2, 8)}`,
    status: "CAPTURED",
    amount: 500,
    currency: "SAR",
    source: { payment_method: "VISA" },
    metadata: { context, schoolId: "s1", ...meta },
    ...overrides,
  })
}

function makeRequest(body: string, signature = ""): Request {
  return new Request("http://localhost:3000/api/webhooks/tap", {
    method: "POST",
    body,
    headers: {
      tap_signature: signature,
    },
  })
}

// Bypass signature verification for unit tests by leaving TAP_WEBHOOK_SECRET unset
// (verifySignature returns true when the env var is absent in non-production).

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Tap Webhook - POST handler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.TAP_WEBHOOK_SECRET
    process.env.NODE_ENV = "test"
    vi.mocked(db.processedWebhookEvent.create).mockResolvedValue({} as never)
  })

  // =========================================================================
  // Signature verification
  // =========================================================================

  describe("signature verification", () => {
    it("returns 400 when secret set but signature absent", async () => {
      process.env.TAP_WEBHOOK_SECRET = "secret123"
      const body = makeCapturedCharge("school_fee", {
        feeAssignmentId: "fa-1",
      })
      const response = await POST(makeRequest(body, ""))

      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toContain("Invalid Tap signature")
    })

    it("returns 400 for invalid JSON body", async () => {
      const response = await POST(makeRequest("not-json"))

      expect(response.status).toBe(400)
    })

    it("returns 400 when charge id or status is missing", async () => {
      const body = JSON.stringify({ status: "CAPTURED" }) // no id
      const response = await POST(makeRequest(body))

      expect(response.status).toBe(400)
    })
  })

  // =========================================================================
  // Non-CAPTURED status — no side-effects
  // =========================================================================

  describe("non-CAPTURED status", () => {
    it("returns 200 with no DB writes for FAILED status", async () => {
      const body = JSON.stringify({
        id: "ch_fail_1",
        status: "FAILED",
        metadata: { context: "school_fee", schoolId: "s1" },
      })
      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.feeAssignment.findFirst).not.toHaveBeenCalled()
      expect(db.payment.create).not.toHaveBeenCalled()
    })

    for (const status of ["DECLINED", "CANCELLED", "ABANDONED", "TIMEDOUT"]) {
      it(`returns 200 with no DB writes for ${status}`, async () => {
        const body = JSON.stringify({
          id: `ch_${status.toLowerCase()}_1`,
          status,
          metadata: { context: "school_fee", schoolId: "s1" },
        })
        const response = await POST(makeRequest(body))

        expect(response.status).toBe(200)
        expect(db.payment.create).not.toHaveBeenCalled()
      })
    }
  })

  // =========================================================================
  // school_fee context — fee payment
  // =========================================================================

  describe("school_fee context", () => {
    function mockAssignment(totalPaid = 0, finalAmount = 1000) {
      vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
        id: "fa-1",
        schoolId: "s1",
        studentId: "st-1",
        finalAmount,
        currency: "SAR",
        payments: totalPaid > 0 ? [{ amount: totalPaid }] : [],
        student: { userId: "u1", firstName: "Ali", lastName: "Hassan" },
      } as never)
    }

    it("records fee payment and marks assignment PAID when fully covered", async () => {
      const body = makeCapturedCharge("school_fee", {
        feeAssignmentId: "fa-1",
      })
      mockAssignment(0, 500)
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-1",
        receiptNumber: "RCP-AABB1122",
        paymentDate: new Date(),
        paymentMethod: "CREDIT_CARD",
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])

      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.payment.create).toHaveBeenCalled()
      expect(db.feeAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "PAID" } })
      )
    })

    it("marks assignment PARTIAL when amount < finalAmount", async () => {
      const body = JSON.stringify({
        id: "ch_partial",
        status: "CAPTURED",
        amount: 300, // paying 300 of 1000
        currency: "SAR",
        source: { payment_method: "MADA" },
        metadata: {
          context: "school_fee",
          schoolId: "s1",
          feeAssignmentId: "fa-1",
        },
      })
      mockAssignment(0, 1000)
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-partial",
        receiptNumber: "RCP-CCDD3344",
        paymentDate: new Date(),
        paymentMethod: "MADA",
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])

      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.feeAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "PARTIAL" } })
      )
    })

    it("INV-002: allocates payment across multiple invoices oldest-first", async () => {
      const body = makeCapturedCharge("school_fee", {
        feeAssignmentId: "fa-multi",
      })
      vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
        id: "fa-multi",
        schoolId: "s1",
        studentId: "st-1",
        finalAmount: 500,
        currency: "SAR",
        payments: [],
        student: { userId: "u1", firstName: "A", lastName: "B" },
      } as never)
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-multi",
        receiptNumber: "RCP-EEFF5566",
        paymentDate: new Date(),
        paymentMethod: "CREDIT_CARD",
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)

      const inv1 = {
        id: "inv-1",
        total: 300,
        amountPaid: 0,
        status: "UNPAID",
        due_date: new Date("2026-01-01"),
      }
      const inv2 = {
        id: "inv-2",
        total: 200,
        amountPaid: 0,
        status: "UNPAID",
        due_date: new Date("2026-02-01"),
      }
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([
        inv1,
        inv2,
      ] as never)
      vi.mocked(db.userInvoice.update).mockResolvedValue({} as never)

      await POST(makeRequest(body))

      expect(db.userInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1" },
          data: { amountPaid: 300, status: "PAID" },
        })
      )
      expect(db.userInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-2" },
          data: { amountPaid: 200, status: "PAID" },
        })
      )
    })

    it("INV-002: sets PARTIAL on invoice when partially covered", async () => {
      const body = JSON.stringify({
        id: "ch_inv_partial",
        status: "CAPTURED",
        amount: 100,
        currency: "SAR",
        source: { payment_method: "VISA" },
        metadata: {
          context: "school_fee",
          schoolId: "s1",
          feeAssignmentId: "fa-inv-partial",
        },
      })
      vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
        id: "fa-inv-partial",
        schoolId: "s1",
        studentId: "st-1",
        finalAmount: 500,
        currency: "SAR",
        payments: [],
        student: { userId: "u1", firstName: "A", lastName: "B" },
      } as never)
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-ip",
        receiptNumber: "RCP-GGHH7788",
        paymentDate: new Date(),
        paymentMethod: "CREDIT_CARD",
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)

      const inv = {
        id: "inv-partial",
        total: 500,
        amountPaid: 0,
        status: "UNPAID",
        due_date: new Date("2026-01-01"),
      }
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([inv] as never)
      vi.mocked(db.userInvoice.update).mockResolvedValue({} as never)

      await POST(makeRequest(body))

      expect(db.userInvoice.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-partial" },
          data: { amountPaid: 100, status: "PARTIAL" },
        })
      )
    })

    it("receipt URL in notification uses /api/payment/:id/receipt", async () => {
      const { dispatchNotification } =
        await import("@/lib/dispatch-notification")
      const body = makeCapturedCharge("school_fee", {
        feeAssignmentId: "fa-url",
      })
      vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
        id: "fa-url",
        schoolId: "s1",
        studentId: "st-1",
        finalAmount: 200,
        currency: "SAR",
        payments: [],
        student: { userId: "u-url", firstName: "X", lastName: "Y" },
      } as never)
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-url-id",
        receiptNumber: "RCP-IIJJ9900",
        paymentDate: new Date(),
        paymentMethod: "CREDIT_CARD",
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])

      await POST(makeRequest(body))

      expect(dispatchNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            url: "/api/payment/pay-url-id/receipt",
          }),
        })
      )
    })

    it("receipt number uses RCP- prefix with 8 uppercase hex chars (R-P2-4)", async () => {
      const body = makeCapturedCharge("school_fee", {
        feeAssignmentId: "fa-rcpt",
      })
      vi.mocked(db.feeAssignment.findFirst).mockResolvedValue({
        id: "fa-rcpt",
        schoolId: "s1",
        studentId: "st-1",
        finalAmount: 100,
        currency: "SAR",
        payments: [],
        student: { userId: "u1", firstName: "A", lastName: "B" },
      } as never)
      vi.mocked(db.payment.create).mockResolvedValue({
        id: "pay-rcpt",
        receiptNumber: "RCP-AABBCCDD",
        paymentDate: new Date(),
        paymentMethod: "CREDIT_CARD",
      } as never)
      vi.mocked(db.feeAssignment.update).mockResolvedValue({} as never)
      vi.mocked(db.userInvoice.findMany).mockResolvedValue([])

      await POST(makeRequest(body))

      const createCall = vi.mocked(db.payment.create).mock.calls[0][0]
      expect(createCall.data.receiptNumber).toMatch(/^RCP-[0-9A-F]{8}$/)
      expect(createCall.data.paymentNumber).toMatch(/^PAY-[0-9A-F]{8}$/)
    })

    it("skips if feeAssignment not found", async () => {
      const body = makeCapturedCharge("school_fee", {
        feeAssignmentId: "fa-missing",
      })
      vi.mocked(db.feeAssignment.findFirst).mockResolvedValue(null)

      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.payment.create).not.toHaveBeenCalled()
    })

    it("returns 200 when feeAssignmentId or schoolId is absent in metadata", async () => {
      const body = JSON.stringify({
        id: "ch_no_fa",
        status: "CAPTURED",
        amount: 100,
        metadata: { context: "school_fee" }, // no schoolId or feeAssignmentId
      })
      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.payment.create).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // TAP-ADMISSION-NO-HANDLER: registration_fee context
  // =========================================================================

  describe("registration_fee context (TAP-ADMISSION-NO-HANDLER fix)", () => {
    it("sets registrationFeePaid on Application and sends notification", async () => {
      const { dispatchNotification } =
        await import("@/lib/dispatch-notification")
      const body = makeCapturedCharge("registration_fee", {
        applicationId: "app-reg-1",
      })
      vi.mocked(db.application.findFirst)
        // idempotency check
        .mockResolvedValueOnce({ registrationFeePaid: false } as never)
        // notification fetch
        .mockResolvedValueOnce({
          userId: "u1",
          applicationNumber: "APP-2026-001",
        } as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "app-reg-1", schoolId: "s1" },
          data: expect.objectContaining({
            registrationFeePaid: true,
            registrationFeeMethod: "tap",
          }),
        })
      )
      expect(dispatchNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "fee_paid",
          metadata: expect.objectContaining({
            paymentType: "registration_fee",
          }),
        })
      )
    })

    it("skips if registrationFeePaid already true (idempotency)", async () => {
      const body = makeCapturedCharge("registration_fee", {
        applicationId: "app-reg-2",
      })
      vi.mocked(db.application.findFirst).mockResolvedValue({
        registrationFeePaid: true,
      } as never)

      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.application.update).not.toHaveBeenCalled()
    })

    it("returns 200 when applicationId is missing", async () => {
      const body = makeCapturedCharge("registration_fee")
      // no applicationId in metadata
      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.application.update).not.toHaveBeenCalled()
    })

    it("does NOT create a Payment row (materialization deferred to enrollment)", async () => {
      const body = makeCapturedCharge("registration_fee", {
        applicationId: "app-reg-3",
      })
      vi.mocked(db.application.findFirst).mockResolvedValue({
        registrationFeePaid: false,
      } as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      await POST(makeRequest(body))

      expect(db.payment.create).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Legacy application_fee context
  // =========================================================================

  describe("application_fee context (legacy tolerated)", () => {
    it("sets applicationFeePaid and notifies", async () => {
      const { dispatchNotification } =
        await import("@/lib/dispatch-notification")
      const body = makeCapturedCharge("application_fee", {
        applicationId: "app-legacy-1",
      })
      vi.mocked(db.application.findFirst)
        .mockResolvedValueOnce({ applicationFeePaid: false } as never)
        .mockResolvedValueOnce({
          userId: "u-legacy",
          applicationNumber: "APP-LEGACY-001",
        } as never)
      vi.mocked(db.application.update).mockResolvedValue({} as never)

      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ applicationFeePaid: true }),
        })
      )
      expect(dispatchNotification).toHaveBeenCalledWith(
        expect.objectContaining({ type: "fee_paid" })
      )
    })

    it("skips if applicationFeePaid already true (idempotency)", async () => {
      const body = makeCapturedCharge("application_fee", {
        applicationId: "app-legacy-2",
      })
      vi.mocked(db.application.findFirst).mockResolvedValue({
        applicationFeePaid: true,
      } as never)

      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.application.update).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Unknown context
  // =========================================================================

  describe("unknown context", () => {
    it("returns 200 with no DB writes", async () => {
      const body = JSON.stringify({
        id: "ch_unknown_ctx",
        status: "CAPTURED",
        metadata: { context: "future_feature", schoolId: "s1" },
      })
      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.payment.create).not.toHaveBeenCalled()
      expect(db.application.update).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Deduplication
  // =========================================================================

  describe("deduplication", () => {
    it("returns 200 immediately for duplicate charge (P2002)", async () => {
      vi.mocked(db.processedWebhookEvent.create).mockRejectedValue({
        code: "P2002",
      })
      const body = makeCapturedCharge("school_fee", {
        feeAssignmentId: "fa-dup",
      })

      const response = await POST(makeRequest(body))

      expect(response.status).toBe(200)
      expect(db.feeAssignment.findFirst).not.toHaveBeenCalled()
    })
  })
})
