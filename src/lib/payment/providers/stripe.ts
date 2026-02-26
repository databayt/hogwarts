// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { stripe } from "@/components/saas-marketing/pricing/lib/stripe"

import { toSmallestUnit } from "../currency"
import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
} from "../types"

// Currencies Stripe does not support
const UNSUPPORTED_CURRENCIES = new Set(["SDG"])

/**
 * Resolve Stripe checkout mode from payment context.
 * Subscriptions use "subscription" mode; everything else uses "payment".
 */
function resolveMode(context: string): "payment" | "subscription" {
  return context === "saas_subscription" ? "subscription" : "payment"
}

export const stripeProvider: PaymentProvider = {
  id: "stripe",

  supportsCurrency(currency: string): boolean {
    return !UNSUPPORTED_CURRENCIES.has(currency.toUpperCase())
  },

  isConfigured(): boolean {
    return stripe !== null
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    if (!stripe) {
      return {
        success: false,
        gateway: "stripe",
        referenceNumber: params.referenceNumber,
        error: "Stripe is not configured",
      }
    }

    const mode = resolveMode(params.context)
    const unitAmount = toSmallestUnit(params.amount, params.currency)

    const lineItems = params.lineItems?.map((item) => ({
      price_data: {
        currency: params.currency.toLowerCase(),
        product_data: {
          name: item.name,
          ...(item.description ? { description: item.description } : {}),
        },
        unit_amount: item.unitAmount,
        ...(mode === "subscription"
          ? { recurring: { interval: "month" as const } }
          : {}),
      },
      quantity: item.quantity,
    })) ?? [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          product_data: { name: `Payment - ${params.referenceNumber}` },
          unit_amount: unitAmount,
          ...(mode === "subscription"
            ? { recurring: { interval: "month" as const } }
            : {}),
        },
        quantity: 1,
      },
    ]

    const session = await stripe.checkout.sessions.create({
      mode,
      payment_method_types: ["card"],
      ...(params.customerEmail ? { customer_email: params.customerEmail } : {}),
      line_items: lineItems,
      metadata: {
        context: params.context,
        referenceId: params.referenceId,
        schoolId: params.schoolId,
        referenceNumber: params.referenceNumber,
        ...params.metadata,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    })

    return {
      success: true,
      gateway: "stripe",
      checkoutUrl: session.url ?? undefined,
      sessionId: session.id,
      referenceNumber: params.referenceNumber,
    }
  },
}
