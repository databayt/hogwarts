// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { tapWebhookUrl } from "../tap-api"
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

const TAP_API_URL = "https://api.tap.company/v2/charges"

/**
 * Tap Payments provider — supports mada, KNET, STC Pay, Apple Pay across the
 * Gulf region. Required for the King Fahad Schools (Saudi) pilot since
 * Stripe card flow is sub-optimal there.
 *
 * Activation: set `TAP_SECRET_KEY`. Until then `isConfigured()` returns false
 * and the provider router skips this gateway. The same secret key also signs
 * Tap's webhooks (see `../tap-api.ts`) — there is no separate webhook secret.
 *
 * Redirect contract: Tap has ONE redirect URL and appends `?tap_id=chg_…` to
 * it for success AND failure alike, so `successUrl` is where the payer lands
 * either way and the landing page must read the charge back before it says
 * "paid" (`verifyReturnedFeePayment`). `cancelUrl` is unused by Tap.
 */
export const tapProvider: PaymentProvider = {
  id: "tap",

  supportsCurrency(currency: string): boolean {
    return SUPPORTED_CURRENCIES.has(currency.toUpperCase())
  },

  isConfigured(): boolean {
    return Boolean(process.env.TAP_SECRET_KEY)
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const secretKey = process.env.TAP_SECRET_KEY
    if (!secretKey) {
      return {
        success: false,
        gateway: "tap",
        referenceNumber: params.referenceNumber,
        error: "Tap is not configured (missing TAP_SECRET_KEY)",
      }
    }

    // Tap requires a customer with at least first_name + (email OR phone).
    // We don't have access to first/last name fields in the generic
    // CreateCheckoutParams, so use a placeholder when only email is present.
    // Schools that want richer Tap customer profiles should populate
    // `metadata.customerFirstName` / `metadata.customerLastName` at the
    // call site.
    const customerFirstName =
      (params.metadata?.customerFirstName as string | undefined) ?? "Customer"
    const customerLastName = params.metadata?.customerLastName as
      | string
      | undefined

    const body = {
      amount: Number(params.amount.toFixed(3)), // Tap uses 3 decimal places
      currency: params.currency.toUpperCase(),
      customer: {
        first_name: customerFirstName,
        ...(customerLastName ? { last_name: customerLastName } : {}),
        ...(params.customerEmail ? { email: params.customerEmail } : {}),
      },
      // `src_all` lets Tap render its own picker for mada / KNET / STC Pay /
      // Apple Pay based on the customer's region. Schools that want to
      // restrict (e.g. Apple Pay only) can override by setting
      // `metadata.tapSourceId` at the call site.
      source: {
        id: (params.metadata?.tapSourceId as string | undefined) ?? "src_all",
      },
      redirect: { url: params.successUrl },
      // Tap POSTs the final charge to this URL (captured or failed only). It
      // must be an absolute public origin — Tap rejects localhost/relative.
      post: { url: tapWebhookUrl() },
      metadata: {
        ...params.metadata,
        context: params.context,
        referenceId: params.referenceId,
        schoolId: params.schoolId,
      },
      reference: { transaction: params.referenceNumber },
      description:
        params.lineItems?.[0]?.description ??
        params.lineItems?.[0]?.name ??
        `Payment ${params.referenceNumber}`,
    }

    let response: Response
    try {
      response = await fetch(TAP_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
    } catch (networkErr) {
      return {
        success: false,
        gateway: "tap",
        referenceNumber: params.referenceNumber,
        error:
          networkErr instanceof Error
            ? `Tap network error: ${networkErr.message}`
            : "Tap network error",
      }
    }

    let json: unknown
    try {
      json = await response.json()
    } catch {
      return {
        success: false,
        gateway: "tap",
        referenceNumber: params.referenceNumber,
        error: `Tap returned ${response.status} with non-JSON body`,
      }
    }

    const data = json as {
      id?: string
      transaction?: { url?: string }
      message?: string
      errors?: Array<{ description?: string }>
    }

    if (!response.ok || !data.transaction?.url || !data.id) {
      const apiMessage =
        data.message ??
        data.errors?.[0]?.description ??
        `Tap charge failed (HTTP ${response.status})`
      return {
        success: false,
        gateway: "tap",
        referenceNumber: params.referenceNumber,
        error: apiMessage,
      }
    }

    return {
      success: true,
      gateway: "tap",
      referenceNumber: params.referenceNumber,
      checkoutUrl: data.transaction.url,
      sessionId: data.id,
    }
  },
}
