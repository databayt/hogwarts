// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { resolveAvailableMethods } from "@/lib/payment/provider"
import type { PaymentGateway } from "@/lib/payment/types"

/**
 * Resolve which payment gateways the registration fee may be paid with.
 *
 * Lives in a plain module (not the `"use server"` actions file, which may only
 * export async functions) so it can be shared by the server action and unit
 * tests as a pure, synchronous helper.
 *
 * - Online gateways (stripe/tap) come from
 *   `resolveAvailableMethods`, which already filters the country's priority
 *   list down to providers that are configured AND support the school's
 *   currency (this is what keeps Stripe from ever being offered to a Sudan
 *   school on SDG — Stripe simply isn't in SD's candidate list, and even
 *   where it is listed, an unsupported currency drops it). They are further
 *   gated by `enableOnlinePayment` — the school's master on/off switch for
 *   online processing.
 * - cash/bank_transfer are manual/offline: always candidates regardless of
 *   currency or `enableOnlinePayment`, since no payment gateway processes them.
 * - `paymentMethods` (if the school configured one) is the final admin
 *   allowlist — it can narrow the set further, including disabling cash or
 *   bank_transfer individually.
 */
export function computeAvailableGateways(
  schoolCountry: string | null | undefined,
  schoolTimezone: string | null | undefined,
  currency: string,
  admissionSettings: {
    enableOnlinePayment: boolean
    paymentMethods: unknown
  } | null
): PaymentGateway[] {
  const resolvedOnline = resolveAvailableMethods(
    schoolCountry,
    schoolTimezone,
    currency
  ).filter((gateway) => gateway !== "cash" && gateway !== "bank_transfer")

  const onlineGateways = admissionSettings?.enableOnlinePayment
    ? resolvedOnline
    : []

  let methods: PaymentGateway[] = [...onlineGateways, "cash", "bank_transfer"]

  const allowList = admissionSettings?.paymentMethods
  if (Array.isArray(allowList) && allowList.length > 0) {
    const allowSet = new Set(allowList as string[])
    methods = methods.filter((method) => allowSet.has(method))
  }

  return methods
}
