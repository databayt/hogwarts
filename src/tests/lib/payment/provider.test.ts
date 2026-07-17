// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Mock } from "vitest"

import {
  createPaymentCheckout,
  getProvider,
  resolveAvailableMethods,
} from "@/lib/payment/provider"
import { tapProvider } from "@/lib/payment/providers/tap"
import { PAYMENT_GATEWAYS } from "@/lib/payment/types"
import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/components/saas-marketing/pricing/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn() } },
  },
}))

const stripeCreate = (
  stripe as unknown as {
    checkout: { sessions: { create: Mock } }
  }
).checkout.sessions.create

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Payment Provider Factory", () => {
  describe("getProvider", () => {
    it("returns the registered provider for each gateway", () => {
      expect(getProvider("stripe")?.id).toBe("stripe")
      expect(getProvider("tap")?.id).toBe("tap")
      expect(getProvider("bankak")?.id).toBe("bankak")
      expect(getProvider("cashi")?.id).toBe("cashi")
      expect(getProvider("cash")?.id).toBe("cash")
      expect(getProvider("bank_transfer")?.id).toBe("bank_transfer")
    })

    it("registers a provider for every gateway in PAYMENT_GATEWAYS", () => {
      // Guards the drift that let `mobile_money` linger in a Zod enum after
      // its provider was gone: the union and the registry must stay in step.
      for (const gateway of PAYMENT_GATEWAYS) {
        expect(
          getProvider(gateway),
          `no provider for "${gateway}"`
        ).toBeDefined()
      }
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
// Stripe provider — amount handling (regression for the $0 school-fee bug)
// ---------------------------------------------------------------------------

describe("Stripe Provider — amount handling", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stripeCreate.mockResolvedValue({ id: "cs_test_1", url: "https://pay/x" })
  })

  const base = {
    currency: "USD",
    context: "school_fee" as const,
    schoolId: "s1",
    referenceId: "ref-1",
    referenceNumber: "FEE-1",
    successUrl: "http://x/success",
    cancelUrl: "http://x/cancel",
  }

  it("rejects a checkout whose lineItems total is zero (would charge $0)", async () => {
    const result = await createPaymentCheckout("stripe", {
      ...base,
      amount: 250,
      lineItems: [{ name: "School Fee", quantity: 1, unitAmount: 0 }],
    } as never)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/greater than zero/i)
    expect(stripeCreate).not.toHaveBeenCalled()
  })

  it("rejects when the top-level amount is zero and no lineItems are given", async () => {
    const result = await createPaymentCheckout("stripe", {
      ...base,
      amount: 0,
    } as never)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/greater than zero/i)
    expect(stripeCreate).not.toHaveBeenCalled()
  })

  it("passes the converted smallest-unit amount when lineItems are correct", async () => {
    const result = await createPaymentCheckout("stripe", {
      ...base,
      amount: 250,
      // 250.50 USD => 25050 cents
      lineItems: [{ name: "School Fee", quantity: 1, unitAmount: 25050 }],
    } as never)

    expect(result.success).toBe(true)
    expect(stripeCreate).toHaveBeenCalledTimes(1)
    const arg = stripeCreate.mock.calls[0][0] as {
      line_items: Array<{ price_data: { unit_amount: number } }>
    }
    expect(arg.line_items[0].price_data.unit_amount).toBe(25050)
  })
})

// ---------------------------------------------------------------------------
// Tap provider — real fetch-based integration (no longer a stub)
// ---------------------------------------------------------------------------

describe("Tap Provider", () => {
  const originalKey = process.env.TAP_SECRET_KEY

  afterEach(() => {
    vi.unstubAllGlobals()
    if (originalKey) process.env.TAP_SECRET_KEY = originalKey
    else delete process.env.TAP_SECRET_KEY
  })

  const params = {
    amount: 100,
    currency: "SAR",
    context: "school_fee" as const,
    schoolId: "s1",
    referenceId: "ref-1",
    referenceNumber: "TAP-TEST-1",
    successUrl: "http://x/success",
    cancelUrl: "http://x/cancel",
  }

  it("declares Gulf currencies supported and rejects others (case-insensitive)", () => {
    for (const c of ["SAR", "AED", "KWD", "QAR", "BHD", "OMR", "usd"]) {
      expect(tapProvider.supportsCurrency(c)).toBe(true)
    }
    expect(tapProvider.supportsCurrency("SDG")).toBe(false)
    expect(tapProvider.supportsCurrency("INR")).toBe(false)
  })

  it("isConfigured() reflects TAP_SECRET_KEY presence", () => {
    delete process.env.TAP_SECRET_KEY
    expect(tapProvider.isConfigured()).toBe(false)
    process.env.TAP_SECRET_KEY = "tk_test_x"
    expect(tapProvider.isConfigured()).toBe(true)
  })

  it("returns an error when TAP_SECRET_KEY is missing (no network call)", async () => {
    delete process.env.TAP_SECRET_KEY
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const result = await tapProvider.createCheckout(params as never)

    expect(result.success).toBe(false)
    expect(result.gateway).toBe("tap")
    expect(result.error).toMatch(/not configured|TAP_SECRET_KEY/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("POSTs a charge and returns the transaction.url on success", async () => {
    process.env.TAP_SECRET_KEY = "tk_test_x"
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: "chg_1",
        transaction: { url: "https://tap/checkout/chg_1" },
      }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await tapProvider.createCheckout(params as never)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/api\.tap\.company/)
    expect(
      (init as { headers: Record<string, string> }).headers.Authorization
    ).toMatch(/Bearer tk_test_x/)
    expect(result.success).toBe(true)
    expect(result.checkoutUrl).toBe("https://tap/checkout/chg_1")
    expect(result.sessionId).toBe("chg_1")
  })

  it("maps an HTTP error response to a failure result", async () => {
    process.env.TAP_SECRET_KEY = "tk_test_x"
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ errors: [{ description: "invalid currency" }] }),
    })
    vi.stubGlobal("fetch", fetchMock)

    const result = await tapProvider.createCheckout(params as never)

    expect(result.success).toBe(false)
    expect(result.gateway).toBe("tap")
    expect(result.error).toMatch(/invalid currency|HTTP 400/i)
  })

  it("maps a network throw to a failure result", async () => {
    process.env.TAP_SECRET_KEY = "tk_test_x"
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNRESET"))
    vi.stubGlobal("fetch", fetchMock)

    const result = await tapProvider.createCheckout(params as never)

    expect(result.success).toBe(false)
    expect(result.error).toMatch(/network|ECONNRESET/i)
  })
})
