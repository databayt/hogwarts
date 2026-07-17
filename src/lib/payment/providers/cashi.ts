// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
  WalletDetails,
} from "../types"

/**
 * Cashi / MyCashi (كاشي) — Sudan's largest electronic payment network,
 * licensed by the Central Bank of Sudan. MyCashi is the consumer wallet;
 * "Cashi Points" are the merchant side.
 *
 * **Manual rail, same as `bankak.ts`** — Cashi settles via merchant QR scanned
 * in the MyCashi app, confirming in the merchant's own app rather than via a
 * webhook to us, and publishes no self-serve merchant API. So: the school
 * publishes its merchant code / QR, the payer sends from MyCashi, then submits
 * the reference plus a screenshot, and the bursar verifies.
 *
 * Per-school availability is decided by `filterConfiguredManualRails` in
 * `../manual-rail-settings.ts`, not by `isConfigured()` (which is env-level and
 * takes no schoolId).
 */
export const cashiProvider: PaymentProvider = {
  id: "cashi",

  supportsCurrency(): boolean {
    return true
  },

  isConfigured(): boolean {
    return true
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const wallet: WalletDetails | undefined = params.metadata?.cashiMerchantCode
      ? {
          provider: "cashi",
          accountName: params.metadata.cashiAccountName ?? "",
          accountNumber: params.metadata.cashiMerchantCode,
          qrUrl: params.metadata.cashiQrUrl,
          instructions: params.metadata.cashiInstructions,
          reference: params.referenceNumber,
        }
      : undefined

    return {
      success: true,
      gateway: "cashi",
      referenceNumber: params.referenceNumber,
      wallet,
    }
  },
}
