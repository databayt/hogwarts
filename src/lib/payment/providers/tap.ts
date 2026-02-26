// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
} from "../types"

// Currencies supported by Tap Payments (Gulf region)
const SUPPORTED_CURRENCIES = new Set([
  "SAR",
  "AED",
  "KWD",
  "QAR",
  "BHD",
  "OMR",
  "USD",
  "EUR",
  "GBP",
  "EGP",
])

/**
 * Tap Payments provider (Phase 1: stub).
 *
 * In Phase 2, this will integrate with https://api.tap.company/v2/charges
 * to support mada, KNET, STC Pay, and Apple Pay for Gulf markets.
 */
export const tapProvider: PaymentProvider = {
  id: "tap",

  supportsCurrency(currency: string): boolean {
    return SUPPORTED_CURRENCIES.has(currency.toUpperCase())
  },

  isConfigured(): boolean {
    return !!process.env.TAP_SECRET_KEY
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // Phase 1: stub — real Tap API integration in Phase 2
    return {
      success: false,
      gateway: "tap",
      referenceNumber: params.referenceNumber,
      error: "Tap Payments integration coming soon",
    }
  },
}
