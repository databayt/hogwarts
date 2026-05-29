// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { createPaymentCheckout, getProvider } from "../provider"
import { tapProvider } from "../providers/tap"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/components/saas-marketing/pricing/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
  },
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Payment Provider Factory", () => {
  describe("getProvider", () => {
    it("returns the registered provider for each gateway", () => {
      expect(getProvider("stripe")?.id).toBe("stripe")
      expect(getProvider("tap")?.id).toBe("tap")
      expect(getProvider("cash")?.id).toBe("cash")
      expect(getProvider("bank_transfer")?.id).toBe("bank_transfer")
      expect(getProvider("mobile_money")?.id).toBe("mobile_money")
    })

    it("returns undefined for an unknown gateway", () => {
      expect(getProvider("unknown" as never)).toBeUndefined()
    })
  })

  describe("createPaymentCheckout — guard rails", () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it("rejects when gateway is not registered", async () => {
      const result = await createPaymentCheckout(
        "not_a_gateway" as never,
        {
          amount: 100,
          currency: "USD",
          context: "school_fee",
          schoolId: "s1",
          referenceId: "ref-1",
          referenceNumber: "REF-1",
          successUrl: "http://x/success",
          cancelUrl: "http://x/cancel",
        } as never
      )

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/not.*registered|unknown|invalid/i)
    })

    it("rejects when provider does not support the requested currency", async () => {
      // Stripe does not support SDG (per providers/stripe.ts:14)
      const result = await createPaymentCheckout("stripe", {
        amount: 100,
        currency: "SDG",
        context: "school_fee",
        schoolId: "s1",
        referenceId: "ref-1",
        referenceNumber: "REF-1",
        successUrl: "http://x/success",
        cancelUrl: "http://x/cancel",
      } as never)

      expect(result.success).toBe(false)
      expect(result.error).toMatch(/currency|support/i)
    })
  })
})

// ---------------------------------------------------------------------------
// Tap stub
// ---------------------------------------------------------------------------

describe("Tap Provider (stub)", () => {
  it("declares all Gulf currencies as supported", () => {
    expect(tapProvider.supportsCurrency("SAR")).toBe(true)
    expect(tapProvider.supportsCurrency("AED")).toBe(true)
    expect(tapProvider.supportsCurrency("KWD")).toBe(true)
    expect(tapProvider.supportsCurrency("QAR")).toBe(true)
    expect(tapProvider.supportsCurrency("BHD")).toBe(true)
    expect(tapProvider.supportsCurrency("OMR")).toBe(true)
  })

  it("normalizes lowercase currency codes", () => {
    expect(tapProvider.supportsCurrency("sar")).toBe(true)
    expect(tapProvider.supportsCurrency("usd")).toBe(true)
  })

  it("rejects unsupported currencies", () => {
    expect(tapProvider.supportsCurrency("SDG")).toBe(false)
    expect(tapProvider.supportsCurrency("INR")).toBe(false)
  })

  it("isConfigured() reflects TAP_SECRET_KEY presence", () => {
    const original = process.env.TAP_SECRET_KEY
    delete process.env.TAP_SECRET_KEY
    expect(tapProvider.isConfigured()).toBe(false)
    process.env.TAP_SECRET_KEY = "tk_test_x"
    expect(tapProvider.isConfigured()).toBe(true)
    if (original) process.env.TAP_SECRET_KEY = original
    else delete process.env.TAP_SECRET_KEY
  })

  it("createCheckout returns a stub failure (Phase 1 — not yet integrated)", async () => {
    // This test pins the stub behavior. When Tap is wired up, this test
    // should be replaced with real-API-integration coverage.
    const result = await tapProvider.createCheckout({
      amount: 100,
      currency: "SAR",
      context: "school_fee",
      schoolId: "s1",
      referenceId: "ref-1",
      referenceNumber: "TAP-TEST-1",
      successUrl: "http://x/success",
      cancelUrl: "http://x/cancel",
    } as never)

    expect(result.success).toBe(false)
    expect(result.gateway).toBe("tap")
    expect(result.error).toMatch(/coming soon|not.*available|integration/i)
  })

  it("guards: createPaymentCheckout('tap', ...) propagates the stub failure", async () => {
    const result = await createPaymentCheckout("tap", {
      amount: 100,
      currency: "SAR",
      context: "school_fee",
      schoolId: "s1",
      referenceId: "ref-1",
      referenceNumber: "TAP-TEST-2",
      successUrl: "http://x/success",
      cancelUrl: "http://x/cancel",
    } as never)

    expect(result.success).toBe(false)
    expect(result.gateway).toBe("tap")
  })
})
