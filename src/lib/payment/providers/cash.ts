// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
} from "../types"

/**
 * Cash payment provider.
 * Records intent to pay in cash and returns instructions.
 * Always configured, supports all currencies.
 */
export const cashProvider: PaymentProvider = {
  id: "cash",

  supportsCurrency(): boolean {
    return true
  },

  isConfigured(): boolean {
    return true
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    return {
      success: true,
      gateway: "cash",
      referenceNumber: params.referenceNumber,
      cashInstructions: params.metadata?.cashInstructions ?? undefined,
    }
  },
}
