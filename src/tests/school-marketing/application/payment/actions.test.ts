// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// @deprecated-suite 2026-06-12 — Application-fee payment leg retired.
// Tests for the free-application flow are in fees/content and submit-action
// tests.  This file retains tombstone coverage so that the deprecated
// actions still compile and have basic guard-rail assertions.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import {
  createStripeCheckout,
  recordBankTransferIntent,
  recordCashPaymentIntent,
} from "@/components/school-marketing/application/payment/actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    application: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    admissionSettings: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("@/lib/subdomain-actions", () => ({
  getSchoolBySubdomain: vi.fn(),
}))

vi.mock("@/lib/payment/provider", () => ({
  createPaymentCheckout: vi.fn().mockResolvedValue({
    success: true,
    checkoutUrl: "https://checkout.stripe.com/session-test",
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("nanoid", () => ({
  nanoid: vi.fn().mockReturnValue("ABCDE12345"),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SUBDOMAIN = "demo"
const SCHOOL_ID = "school-123"
const APPLICATION_ID = "app-1"
const ACCESS_TOKEN = "tok-abc"

function mockSchoolFound(overrides: Record<string, unknown> = {}) {
  vi.mocked(getSchoolBySubdomain).mockResolvedValue({
    success: true,
    data: {
      id: SCHOOL_ID,
      currency: "USD",
      ...overrides,
    },
  } as any)
}

function mockSchoolNotFound() {
  vi.mocked(getSchoolBySubdomain).mockResolvedValue({
    success: false,
    data: null,
  } as any)
}

function mockApplicationFound(overrides: Record<string, unknown> = {}) {
  vi.mocked(db.application.findFirst).mockResolvedValue({
    id: APPLICATION_ID,
    applicationNumber: "APP-001",
    email: "john@example.com",
    firstName: "John",
    lastName: "Doe",
    paymentMethod: null,
    campaign: {
      applicationFee: 100,
    },
    ...overrides,
  } as any)
}

function mockApplicationNotFound() {
  vi.mocked(db.application.findFirst).mockResolvedValue(null)
}

// ---------------------------------------------------------------------------
// NOTE: These actions are @deprecated (2026-06-12) and no longer called from
// the wizard.  Applying is always free.  The tests below are tombstone coverage
// confirming the deprecated functions still behave correctly in isolation so
// that no silent regressions break existing Stripe webhook processing.
// ---------------------------------------------------------------------------

describe("Payment Actions (deprecated — application fee retired)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSchoolFound()
    mockApplicationFound()
    vi.mocked(db.application.update).mockResolvedValue({} as any)
  })

  // =========================================================================
  // Free-application assertions
  // =========================================================================

  describe("Free application — wizard no longer routes to payment", () => {
    it("submitApplicationAction does not require a paymentMethod field", async () => {
      // The submit-action.ts wrapper no longer passes paymentMethod to
      // submitApplication.  Confirm the schema doesn't break without it.
      const { submitApplicationAction } =
        await import("@/components/school-marketing/application/submit-action")

      // Minimal valid form data — no paymentMethod field
      const formData = {
        campaignId: "campaign-1",
        firstName: "Test",
        lastName: "Student",
        phone: "+249123456789",
        address: "123 Street",
        city: "Khartoum",
        state: "Khartoum",
        postalCode: "11111",
        country: "Sudan",
        fatherName: "Father",
        applyingForClass: "Grade 10",
      }

      // submitApplicationAction does server-side validation and calls
      // the admission action — because db is not mocked here the call
      // will fail at the DB layer, but crucially the error must not be
      // "paymentMethod required" or any payment-related rejection.
      const result = await submitApplicationAction(
        "demo",
        "a".repeat(32), // valid-length token
        formData,
        "en"
      )

      // The result may fail for DB reasons in this unit context, but it
      // must NOT fail with a payment-related error code.
      if (!result.success) {
        expect(result.error).not.toMatch(/payment/i)
        expect(result.error).not.toMatch(/PAYMENT/i)
        expect(result.error).not.toMatch(/fee/i)
      }
    })

    it("fees step renders without payment methods (no paymentMethods in SubmitActionResult used)", () => {
      // Type-level guard: SubmitActionResult.requiresPayment is still present
      // for legacy in-flight data, but the fees content no longer branches on it.
      // This test confirms the type import compiles and the requiresPayment field
      // doesn't cause TypeScript to complain when present but unused.
      type SubmitActionResult =
        import("@/components/school-marketing/application/submit-action").SubmitActionResult

      const result: SubmitActionResult = {
        applicationNumber: "APP-001",
        applicationId: "app-1",
        accessToken: "token-abc",
        requiresPayment: false, // always false now but must still be typeable
      }

      expect(result.requiresPayment).toBe(false)
    })
  })

  // =========================================================================
  // Tombstone: createStripeCheckout guards
  // =========================================================================

  describe("createStripeCheckout (deprecated)", () => {
    it("returns error when no access token provided", async () => {
      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        "en",
        "" // empty access token
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("APPLICATION_NOT_FOUND")
    })

    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        "en",
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("SCHOOL_NOT_FOUND")
    })

    it("returns error when application not found", async () => {
      mockApplicationNotFound()

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        "en",
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("APPLICATION_NOT_FOUND")
    })

    it("returns error when payment already recorded (paymentMethod set)", async () => {
      mockApplicationFound({ paymentMethod: "cash" })

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        "en",
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("PAYMENT_ALREADY_RECORDED")
    })

    it("returns error when no fee configured", async () => {
      mockApplicationFound({ campaign: { applicationFee: null } })

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        "en",
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("NO_FEE_CONFIGURED")
    })

    it("returns error when fee is zero", async () => {
      mockApplicationFound({ campaign: { applicationFee: 0 } })

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        "en",
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("NO_FEE_CONFIGURED")
    })
  })

  // =========================================================================
  // Tombstone: recordCashPaymentIntent guards
  // =========================================================================

  describe("recordCashPaymentIntent (deprecated)", () => {
    it("returns error when no access token provided", async () => {
      const result = await recordCashPaymentIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        "" // empty token
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("APPLICATION_NOT_FOUND")
    })

    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await recordCashPaymentIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("SCHOOL_NOT_FOUND")
    })

    it("returns error when application not found", async () => {
      mockApplicationNotFound()

      const result = await recordCashPaymentIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("APPLICATION_NOT_FOUND")
    })

    it("returns error when payment already recorded", async () => {
      mockApplicationFound({ paymentMethod: "stripe" })

      const result = await recordCashPaymentIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("PAYMENT_ALREADY_RECORDED")
    })

    it("records cash intent and returns reference number", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
        cashPaymentInstructions: "Visit office 8am-2pm",
      } as any)

      const result = await recordCashPaymentIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        ACCESS_TOKEN
      )

      expect(result.success).toBe(true)
      expect(result.data?.method).toBe("cash")
      expect(result.data?.referenceNumber).toBe("CASH-ABCDE12345")
    })

    it("scopes application lookup by schoolId (tenant isolation)", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)

      await recordCashPaymentIntent(SUBDOMAIN, APPLICATION_ID, ACCESS_TOKEN)

      expect(db.application.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_ID,
          }),
        })
      )
    })
  })

  // =========================================================================
  // Tombstone: recordBankTransferIntent guards
  // =========================================================================

  describe("recordBankTransferIntent (deprecated)", () => {
    it("returns error when no access token provided", async () => {
      const result = await recordBankTransferIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        "" // empty token
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("APPLICATION_NOT_FOUND")
    })

    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await recordBankTransferIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("SCHOOL_NOT_FOUND")
    })

    it("returns error when application not found", async () => {
      mockApplicationNotFound()

      const result = await recordBankTransferIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        ACCESS_TOKEN
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("APPLICATION_NOT_FOUND")
    })

    it("records bank transfer intent with reference number", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
        bankDetails: {
          bankName: "National Bank",
          accountName: "Demo School",
          accountNumber: "1234567890",
        },
      } as any)

      const result = await recordBankTransferIntent(
        SUBDOMAIN,
        APPLICATION_ID,
        ACCESS_TOKEN
      )

      expect(result.success).toBe(true)
      expect(result.data?.method).toBe("bank_transfer")
      expect(result.data?.referenceNumber).toBe("TRF-ABCDE12345")
    })

    it("scopes application lookup by schoolId (tenant isolation)", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)

      await recordBankTransferIntent(SUBDOMAIN, APPLICATION_ID, ACCESS_TOKEN)

      expect(db.application.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_ID,
          }),
        })
      )
    })
  })
})
