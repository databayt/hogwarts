// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"

import {
  createStripeCheckout,
  recordBankTransferIntent,
  recordCashPaymentIntent,
} from "../actions"

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

vi.mock("@/components/saas-marketing/pricing/lib/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
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
const LOCALE = "en"

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
// Tests
// ---------------------------------------------------------------------------

describe("Payment Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSchoolFound()
    mockApplicationFound()
    vi.mocked(db.application.update).mockResolvedValue({} as any)
  })

  // =========================================================================
  // createStripeCheckout
  // =========================================================================

  describe("createStripeCheckout", () => {
    it("returns error when Stripe is not configured", async () => {
      // Temporarily replace the stripe mock with null
      const originalStripe = stripe
      const stripeModule =
        await import("@/components/saas-marketing/pricing/lib/stripe")
      Object.defineProperty(stripeModule, "stripe", {
        value: null,
        writable: true,
        configurable: true,
      })

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        LOCALE
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Stripe is not configured")

      // Restore
      Object.defineProperty(stripeModule, "stripe", {
        value: originalStripe,
        writable: true,
        configurable: true,
      })
    })

    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await createStripeCheckout(
        "nonexistent",
        APPLICATION_ID,
        LOCALE
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("returns error when application not found", async () => {
      mockApplicationNotFound()

      const result = await createStripeCheckout(
        SUBDOMAIN,
        "nonexistent",
        LOCALE
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Application not found")
    })

    it("returns error when no application fee is configured", async () => {
      mockApplicationFound({
        campaign: { applicationFee: null },
      })

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        LOCALE
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("No application fee configured")
    })

    it("returns error when application fee is zero", async () => {
      mockApplicationFound({
        campaign: { applicationFee: 0 },
      })

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        LOCALE
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("No application fee configured")
    })

    it("creates Stripe checkout session with correct parameters", async () => {
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        url: "https://checkout.stripe.com/session-123",
      } as any)

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        LOCALE
      )

      expect(result.success).toBe(true)
      expect(result.data?.method).toBe("stripe")
      expect(result.data?.checkoutUrl).toBe(
        "https://checkout.stripe.com/session-123"
      )
      expect(result.data?.referenceNumber).toBe("PAY-ABCDE12345")

      // Verify Stripe was called with correct amount (100 * 100 = 10000 cents)
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "payment",
          payment_method_types: ["card"],
          customer_email: "john@example.com",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: "Application Fee - APP-001",
                  description: "Application fee for John Doe",
                },
                unit_amount: 10000,
              },
              quantity: 1,
            },
          ],
          metadata: {
            type: "application_fee",
            applicationId: APPLICATION_ID,
            schoolId: SCHOOL_ID,
            referenceNumber: "PAY-ABCDE12345",
          },
        })
      )
    })

    it("updates application with payment method and reference", async () => {
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        url: "https://checkout.stripe.com/session-123",
      } as any)

      await createStripeCheckout(SUBDOMAIN, APPLICATION_ID, LOCALE)

      expect(db.application.update).toHaveBeenCalledWith({
        where: { id: APPLICATION_ID, schoolId: SCHOOL_ID },
        data: {
          paymentMethod: "stripe",
          paymentReference: "PAY-ABCDE12345",
        },
      })
    })

    it("uses school currency for Stripe session", async () => {
      mockSchoolFound({ currency: "SAR" })
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        url: "https://checkout.stripe.com/session-456",
      } as any)

      await createStripeCheckout(SUBDOMAIN, APPLICATION_ID, LOCALE)

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: "sar",
              }),
            }),
          ],
        })
      )
    })

    it("defaults to USD when school has no currency set", async () => {
      mockSchoolFound({ currency: null })
      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        url: "https://checkout.stripe.com/session-789",
      } as any)

      await createStripeCheckout(SUBDOMAIN, APPLICATION_ID, LOCALE)

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: "usd",
              }),
            }),
          ],
        })
      )
    })

    it("returns error when Stripe session creation fails", async () => {
      vi.mocked(stripe.checkout.sessions.create).mockRejectedValue(
        new Error("Stripe API error")
      )

      const result = await createStripeCheckout(
        SUBDOMAIN,
        APPLICATION_ID,
        LOCALE
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to create checkout session")
    })
  })

  // =========================================================================
  // recordCashPaymentIntent
  // =========================================================================

  describe("recordCashPaymentIntent", () => {
    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await recordCashPaymentIntent(
        "nonexistent",
        APPLICATION_ID
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("returns error when application not found", async () => {
      mockApplicationNotFound()

      const result = await recordCashPaymentIntent(SUBDOMAIN, "nonexistent")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Application not found")
    })

    it("records cash payment intent with reference number", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
        cashPaymentInstructions: "Visit the school office between 8am-2pm",
      } as any)

      const result = await recordCashPaymentIntent(SUBDOMAIN, APPLICATION_ID)

      expect(result.success).toBe(true)
      expect(result.data?.method).toBe("cash")
      expect(result.data?.referenceNumber).toBe("CASH-ABCDE12345")
      expect(result.data?.cashInstructions).toBe(
        "Visit the school office between 8am-2pm"
      )
    })

    it("updates application with cash payment method", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)

      await recordCashPaymentIntent(SUBDOMAIN, APPLICATION_ID)

      expect(db.application.update).toHaveBeenCalledWith({
        where: { id: APPLICATION_ID, schoolId: SCHOOL_ID },
        data: {
          paymentMethod: "cash",
          paymentReference: "CASH-ABCDE12345",
        },
      })
    })

    it("returns undefined cashInstructions when no settings exist", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)

      const result = await recordCashPaymentIntent(SUBDOMAIN, APPLICATION_ID)

      expect(result.success).toBe(true)
      expect(result.data?.cashInstructions).toBeUndefined()
    })

    it("returns error on unexpected exception", async () => {
      vi.mocked(db.application.findFirst).mockRejectedValue(
        new Error("Connection reset")
      )

      const result = await recordCashPaymentIntent(SUBDOMAIN, APPLICATION_ID)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to record payment intent")
    })
  })

  // =========================================================================
  // recordBankTransferIntent
  // =========================================================================

  describe("recordBankTransferIntent", () => {
    it("returns error when school not found", async () => {
      mockSchoolNotFound()

      const result = await recordBankTransferIntent(
        "nonexistent",
        APPLICATION_ID
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("School not found")
    })

    it("returns error when application not found", async () => {
      mockApplicationNotFound()

      const result = await recordBankTransferIntent(SUBDOMAIN, "nonexistent")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Application not found")
    })

    it("records bank transfer intent with bank details", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue({
        bankDetails: {
          bankName: "National Bank",
          accountName: "Demo School",
          accountNumber: "1234567890",
          iban: "SA123456789",
          swiftCode: "NBSAAU2S",
        },
      } as any)

      const result = await recordBankTransferIntent(SUBDOMAIN, APPLICATION_ID)

      expect(result.success).toBe(true)
      expect(result.data?.method).toBe("bank_transfer")
      expect(result.data?.referenceNumber).toBe("TRF-ABCDE12345")
      expect(result.data?.bankDetails).toEqual({
        bankName: "National Bank",
        accountName: "Demo School",
        accountNumber: "1234567890",
        iban: "SA123456789",
        swiftCode: "NBSAAU2S",
        reference: "TRF-ABCDE12345",
      })
    })

    it("updates application with bank transfer payment method", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)

      await recordBankTransferIntent(SUBDOMAIN, APPLICATION_ID)

      expect(db.application.update).toHaveBeenCalledWith({
        where: { id: APPLICATION_ID, schoolId: SCHOOL_ID },
        data: {
          paymentMethod: "bank_transfer",
          paymentReference: "TRF-ABCDE12345",
        },
      })
    })

    it("returns undefined bankDetails when no settings exist", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)

      const result = await recordBankTransferIntent(SUBDOMAIN, APPLICATION_ID)

      expect(result.success).toBe(true)
      expect(result.data?.bankDetails).toBeUndefined()
    })

    it("returns error on unexpected exception", async () => {
      vi.mocked(db.application.update).mockRejectedValue(
        new Error("DB timeout")
      )

      const result = await recordBankTransferIntent(SUBDOMAIN, APPLICATION_ID)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Failed to record payment intent")
    })

    it("scopes application lookup by schoolId for tenant isolation", async () => {
      vi.mocked(db.admissionSettings.findUnique).mockResolvedValue(null)

      await recordBankTransferIntent(SUBDOMAIN, APPLICATION_ID)

      expect(db.application.findFirst).toHaveBeenCalledWith({
        where: { id: APPLICATION_ID, schoolId: SCHOOL_ID },
        select: { id: true, applicationNumber: true },
      })
    })
  })
})
