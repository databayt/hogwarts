// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
  WalletDetails,
} from "../types"

/**
 * Bankak (بنكك) — Bank of Khartoum. Sudan's dominant payment rail.
 *
 * **This is a manual rail, not a hosted checkout.** BoK does not publish a
 * self-serve merchant API — it sells "Bankak Pay QR" / Merchant QR, which
 * confirms inside the merchant's own Bankak app rather than via a webhook to
 * us. So there is nothing to redirect to and nothing to call: the school
 * publishes its account number (and optionally a QR), the payer transfers in
 * the Bankak app, then submits the transfer reference plus a screenshot, and
 * the bursar verifies it. Same shape as `cash.ts` / `bank-transfer.ts`.
 *
 * This replaces the earlier env-gated scaffold, which returned
 * `isConfigured() === false` forever (BANKAK_MERCHANT_ID was never issued) and
 * therefore made `resolveAvailableMethods` drop Bankak from every Sudan
 * school's gateway list — leaving SD schools with no payment path at all,
 * since Stripe rejects SDG and Tap does not cover SD.
 *
 * Per-school availability is NOT decided here: `isConfigured()` is env-level
 * and takes no schoolId. It is decided by `filterConfiguredManualRails` in
 * `../manual-rail-settings.ts`, which drops this rail unless the school has
 * actually configured a Bankak account.
 *
 * If BoK ever ships a real merchant API, add a `checkoutUrl` branch here; the
 * `PaymentProvider` contract and every caller stay unchanged.
 */
export const bankakProvider: PaymentProvider = {
  id: "bankak",

  supportsCurrency(): boolean {
    // Manual rail — the school's own account settles it, so there is no
    // processor currency matrix to satisfy.
    return true
  },

  isConfigured(): boolean {
    // No API key exists to check. Per-school gating happens in
    // filterConfiguredManualRails().
    return true
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // Account details pass through metadata from the caller, resolved from
    // SchoolPaymentSettings at the action layer (same contract as bank-transfer).
    const wallet: WalletDetails | undefined = params.metadata
      ?.bankakAccountNumber
      ? {
          provider: "bankak",
          accountName: params.metadata.bankakAccountName ?? "",
          accountNumber: params.metadata.bankakAccountNumber,
          qrUrl: params.metadata.bankakQrUrl,
          instructions: params.metadata.bankakInstructions,
          reference: params.referenceNumber,
        }
      : undefined

    return {
      success: true,
      gateway: "bankak",
      referenceNumber: params.referenceNumber,
      wallet,
    }
  },
}
