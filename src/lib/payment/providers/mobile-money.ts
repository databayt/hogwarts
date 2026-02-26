// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
} from "../types"

/**
 * Mobile money provider for Sudan (Bankak, mBOK).
 *
 * Phase 1: Records intent and returns instructions (same pattern as cash).
 * No API call — manual verification workflow.
 */
export const mobileMoneyProvider: PaymentProvider = {
  id: "mobile_money",

  supportsCurrency(currency: string): boolean {
    // Primarily for SDG, but no hard restriction
    return true
  },

  isConfigured(): boolean {
    // Available for all schools — no API key needed for manual flow
    return true
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    return {
      success: true,
      gateway: "mobile_money",
      referenceNumber: params.referenceNumber,
      mobileMoneyInstructions:
        params.metadata?.mobileMoneyInstructions ?? undefined,
    }
  },
}
