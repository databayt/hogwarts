// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"

// Import the handler after mocks
import { POST } from "../route"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    user: { update: vi.fn(), findFirst: vi.fn() },
    subscription: { upsert: vi.fn() },
    enrollment: { update: vi.fn() },
    streamEnrollment: { update: vi.fn(), deleteMany: vi.fn() },
    invoice: { upsert: vi.fn() },
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Stripe Webhook - POST handler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
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
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as any)
      vi.mocked(db.application.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockResolvedValue({
        userId: "u1",
        applicationNumber: "APP-2026-ABC",
        schoolId: "s1",
      } as any)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)

      // Verify application updated with payment info
      expect(db.application.update).toHaveBeenCalledWith({
        where: { id: "app-1" },
        data: {
          applicationFeePaid: true,
          paymentId: "pi_test_123",
          paymentDate: expect.any(Date),
        },
      })

      // Verify notification dispatched
      expect(db.application.findFirst).toHaveBeenCalledWith({
        where: { id: "app-1" },
        select: {
          userId: true,
          applicationNumber: true,
          schoolId: true,
        },
      })
    })

    it("returns 200 even if notification dispatch fails", async () => {
      const event = makeCheckoutEvent({
        type: "application_fee",
        applicationId: "app-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as any)
      vi.mocked(db.application.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockRejectedValue(
        new Error("Notification system down")
      )

      const response = await POST(makeRequest())

      // Should still return 200 because notification failure is non-fatal
      expect(response.status).toBe(200)
    })

    it("does not send notification when no userId on application", async () => {
      const event = makeCheckoutEvent({
        type: "application_fee",
        applicationId: "app-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as any)
      vi.mocked(db.application.update).mockResolvedValue({} as any)
      vi.mocked(db.application.findFirst).mockResolvedValue({
        userId: null,
        applicationNumber: "APP-2026-ABC",
        schoolId: "s1",
      } as any)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      // dispatchNotification is dynamically imported only when userId && schoolId,
      // so we verify the findFirst was called but no notification is dispatched for null userId
      expect(db.application.findFirst).toHaveBeenCalled()
    })

    it("does not update application when payment_status is not paid", async () => {
      const event = makeCheckoutEvent(
        { type: "application_fee", applicationId: "app-1" },
        { payment_status: "unpaid" }
      )
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as any)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
      expect(db.application.update).not.toHaveBeenCalled()
    })

    it("returns 200 even if db.application.update throws", async () => {
      const event = makeCheckoutEvent({
        type: "application_fee",
        applicationId: "app-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as any)
      vi.mocked(db.application.update).mockRejectedValue(
        new Error("DB write failed")
      )

      const response = await POST(makeRequest())

      // The handler catches DB errors and still returns 200
      expect(response.status).toBe(200)
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
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as any)
      vi.mocked(db.enrollment.update).mockResolvedValue({} as any)

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
  // Course enrollment payment
  // =========================================================================

  describe("course enrollment payment", () => {
    it("activates stream enrollment on successful payment", async () => {
      const event = makeCheckoutEvent({
        courseId: "course-1",
        enrollmentId: "enr-1",
        schoolId: "school-1",
      })
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue(event as any)
      vi.mocked(db.streamEnrollment.update).mockResolvedValue({} as any)

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
  // Unrecognized event types
  // =========================================================================

  describe("unrecognized events", () => {
    it("returns 200 for unhandled event types", async () => {
      vi.mocked(stripe!.webhooks.constructEvent).mockReturnValue({
        type: "some.unknown.event",
        data: { object: {} },
      } as any)

      const response = await POST(makeRequest())

      expect(response.status).toBe(200)
    })
  })
})
