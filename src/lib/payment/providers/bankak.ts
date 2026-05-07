// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
} from "../types"

/**
 * Bankak Payments provider — Sudan-only mobile money via Bank of Khartoum.
 *
 * **Status: scaffold only.** The Bankak merchant API spec is not publicly
 * documented; until Bank of Khartoum provides the integration contract this
 * provider returns `success: false` with a clear error message. The shape
 * mirrors `tap.ts` so when the spec lands the only changes needed are:
 *
 *   1. Implement `createCheckout` to POST to Bankak's charge endpoint.
 *   2. Wire `src/app/api/webhooks/bankak/route.ts` to the same fee-payment
 *      handler used by Stripe and Tap.
 *   3. Add a per-school `bankakEnabled` flag (when introduced).
 *
 * Activation env vars (placeholders — real names TBD by BoK):
 *   - `BANKAK_MERCHANT_ID`
 *   - `BANKAK_SECRET_KEY`
 *   - `BANKAK_WEBHOOK_SECRET`
 *
 * Until those are set `isConfigured()` returns false and the provider
 * router skips this gateway, so shipping the scaffold is safe even on
 * tenants that have no Sudan business.
 */
const SUPPORTED_CURRENCIES = new Set(["SDG", "USD"])

export const bankakProvider: PaymentProvider = {
  id: "bankak",

  supportsCurrency(currency: string): boolean {
    return SUPPORTED_CURRENCIES.has(currency.toUpperCase())
  },

  isConfigured(): boolean {
    return Boolean(
      process.env.BANKAK_MERCHANT_ID && process.env.BANKAK_SECRET_KEY
    )
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    return {
      success: false,
      gateway: "bankak",
      referenceNumber: params.referenceNumber,
      error:
        "Bankak integration pending merchant API spec from Bank of Khartoum",
    }
  },
}
