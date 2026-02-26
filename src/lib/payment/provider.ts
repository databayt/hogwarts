// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { resolvePaymentGateways } from "./gateway-config"
import { bankTransferProvider } from "./providers/bank-transfer"
import { cashProvider } from "./providers/cash"
import { mobileMoneyProvider } from "./providers/mobile-money"
import { stripeProvider } from "./providers/stripe"
import { tapProvider } from "./providers/tap"
import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentGateway,
  PaymentProvider,
} from "./types"

// --- Provider Registry ---

const providers = new Map<PaymentGateway, PaymentProvider>()

function registerProvider(provider: PaymentProvider) {
  providers.set(provider.id, provider)
}

// Register all built-in providers
registerProvider(stripeProvider)
registerProvider(tapProvider)
registerProvider(cashProvider)
registerProvider(bankTransferProvider)
registerProvider(mobileMoneyProvider)

/**
 * Get a specific provider by gateway type.
 */
export function getProvider(
  gateway: PaymentGateway
): PaymentProvider | undefined {
  return providers.get(gateway)
}

/**
 * Resolve available payment methods for a school.
 * Filters country defaults to only configured + currency-compatible providers.
 */
export function resolveAvailableMethods(
  schoolCountry?: string | null,
  schoolTimezone?: string | null,
  currency?: string
): PaymentGateway[] {
  const gateways = resolvePaymentGateways(schoolCountry, schoolTimezone)

  return gateways.filter((gateway) => {
    const provider = providers.get(gateway)
    if (!provider) return false
    if (!provider.isConfigured()) return false
    if (currency && !provider.supportsCurrency(currency)) return false
    return true
  })
}

/**
 * Create a payment checkout via the appropriate provider.
 */
export async function createPaymentCheckout(
  gateway: PaymentGateway,
  params: CreateCheckoutParams
): Promise<CheckoutResult> {
  const provider = providers.get(gateway)
  if (!provider) {
    return {
      success: false,
      gateway,
      referenceNumber: params.referenceNumber,
      error: `Unknown payment gateway: ${gateway}`,
    }
  }

  if (!provider.isConfigured()) {
    return {
      success: false,
      gateway,
      referenceNumber: params.referenceNumber,
      error: `Payment gateway "${gateway}" is not configured`,
    }
  }

  if (!provider.supportsCurrency(params.currency)) {
    return {
      success: false,
      gateway,
      referenceNumber: params.referenceNumber,
      error: `Gateway "${gateway}" does not support currency ${params.currency}`,
    }
  }

  return provider.createCheckout(params)
}
