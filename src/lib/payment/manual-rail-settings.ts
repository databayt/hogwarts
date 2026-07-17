// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { SchoolPaymentSettings } from "@prisma/client"

import { db } from "@/lib/db"

import type { PaymentGateway, WalletDetails } from "./types"

/**
 * Per-school gating for the manual wallet rails (Bankak, Cashi).
 *
 * Why this lives outside the provider registry: `PaymentProvider.isConfigured()`
 * is env-level and takes no schoolId, so it cannot answer "has *this* school
 * published a Bankak account?". Rather than thread schoolId through all six
 * providers, we gate as a post-filter — the same way `computeAvailableGateways`
 * already post-filters online rails on `enableOnlinePayment`.
 *
 * A rail the school hasn't configured must never be offered: it would render a
 * "pay here" card with no account number to pay to.
 */

export async function getSchoolPaymentSettings(
  schoolId: string
): Promise<SchoolPaymentSettings | null> {
  return db.schoolPaymentSettings.findUnique({ where: { schoolId } })
}

/** True when the school has both enabled the rail and given it an account. */
export function isManualRailConfigured(
  gateway: PaymentGateway,
  settings: SchoolPaymentSettings | null
): boolean {
  switch (gateway) {
    case "bankak":
      return Boolean(settings?.bankakEnabled && settings.bankakAccountNumber)
    case "cashi":
      return Boolean(settings?.cashiEnabled && settings.cashiMerchantCode)
    default:
      // cash / bank_transfer source their details from AdmissionSettings and
      // are gated by the admin's `paymentMethods` allowlist, not here.
      return true
  }
}

/**
 * Drop wallet rails the school has not configured. Leaves every other gateway
 * untouched, so this is safe to apply to any resolved gateway list.
 */
export function filterConfiguredManualRails(
  gateways: PaymentGateway[],
  settings: SchoolPaymentSettings | null
): PaymentGateway[] {
  return gateways.filter((gateway) => isManualRailConfigured(gateway, settings))
}

/**
 * Flatten the school's wallet config into the `metadata` bag that
 * `bankak`/`cashi` `createCheckout` reads. Mirrors how the caller resolves
 * `bankDetails` from AdmissionSettings for the bank_transfer rail.
 */
export function walletCheckoutMetadata(
  settings: SchoolPaymentSettings | null
): Record<string, string> {
  const metadata: Record<string, string> = {}
  if (!settings) return metadata

  if (settings.bankakEnabled && settings.bankakAccountNumber) {
    metadata.bankakAccountNumber = settings.bankakAccountNumber
    if (settings.bankakAccountName)
      metadata.bankakAccountName = settings.bankakAccountName
    if (settings.bankakQrUrl) metadata.bankakQrUrl = settings.bankakQrUrl
    if (settings.bankakInstructions)
      metadata.bankakInstructions = settings.bankakInstructions
  }

  if (settings.cashiEnabled && settings.cashiMerchantCode) {
    metadata.cashiMerchantCode = settings.cashiMerchantCode
    if (settings.cashiAccountName)
      metadata.cashiAccountName = settings.cashiAccountName
    if (settings.cashiQrUrl) metadata.cashiQrUrl = settings.cashiQrUrl
    if (settings.cashiInstructions)
      metadata.cashiInstructions = settings.cashiInstructions
  }

  return metadata
}

/**
 * Resolve a wallet rail's display details straight from settings, for surfaces
 * that render the account without going through `createCheckout`.
 */
export function resolveWalletDetails(
  gateway: Extract<PaymentGateway, "bankak" | "cashi">,
  settings: SchoolPaymentSettings | null,
  reference: string
): WalletDetails | undefined {
  if (!isManualRailConfigured(gateway, settings) || !settings) return undefined

  return gateway === "bankak"
    ? {
        provider: "bankak",
        accountName: settings.bankakAccountName ?? "",
        accountNumber: settings.bankakAccountNumber!,
        qrUrl: settings.bankakQrUrl ?? undefined,
        instructions: settings.bankakInstructions ?? undefined,
        reference,
      }
    : {
        provider: "cashi",
        accountName: settings.cashiAccountName ?? "",
        accountNumber: settings.cashiMerchantCode!,
        qrUrl: settings.cashiQrUrl ?? undefined,
        instructions: settings.cashiInstructions ?? undefined,
        reference,
      }
}
