// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Tap Payments — server-side API client + webhook signature.
 *
 * Two jobs, both money-critical:
 *
 * 1. `fetchTapCharge(id)` — read a charge back from Tap. The webhook handler
 *    and the post-checkout return page BOTH act on this fetched object, never
 *    on a body a browser or a webhook caller handed us. Tap's own docs say the
 *    webhook exists so merchants can "check the actual payment status", and
 *    the hashstring below does not cover `metadata` — so a posted body must
 *    never decide WHICH fee gets marked paid. Only Tap's answer does.
 *
 * 2. `verifyTapHashstring(...)` — Tap's webhook signature, exactly per
 *    https://developers.tap.company/docs/webhook :
 *
 *      header  `hashstring`
 *      string  x_id{id}x_amount{amount}x_currency{currency}
 *              x_gateway_reference{reference.gateway|""}
 *              x_payment_reference{reference.payment}
 *              x_status{status}x_created{transaction.created}
 *      amount  rounded to the currency's ISO minor units ("1.00" SAR,
 *              "1.000" KWD) — an extra step after receiving the payload
 *      key     the merchant's SECRET API KEY (sk_test_… / sk_live_…),
 *              HMAC-SHA256, hex
 *
 *    The previous handler read a `tap_signature` header, hashed the raw body
 *    and keyed with a separate TAP_WEBHOOK_SECRET — none of which Tap sends or
 *    uses — so every genuine Tap webhook was rejected as "Invalid Tap
 *    signature" the moment the rail was configured.
 */

import "server-only"

import crypto from "node:crypto"

import { getDecimalPlaces } from "./currency"

export const TAP_API_BASE = "https://api.tap.company/v2"

/** The subset of Tap's Charge object we read. */
export interface TapCharge {
  id: string
  object?: string
  status: string
  amount?: number
  currency?: string
  live_mode?: boolean
  transaction?: { created?: string | number; url?: string }
  reference?: {
    transaction?: string
    order?: string
    payment?: string
    gateway?: string
  }
  source?: { id?: string; payment_method?: string; type?: string }
  card?: { brand?: string; scheme?: string; last_four?: string }
  metadata?: Record<string, string | undefined>
  response?: { code?: string; message?: string }
}

/** Tap statuses that mean "the money moved" — the only ones we record. */
export const TAP_CAPTURED_STATUSES = new Set(["CAPTURED"])

/** Terminal failure statuses — notify the payer, never write money. */
export const TAP_FAILED_STATUSES = new Set([
  "FAILED",
  "DECLINED",
  "CANCELLED",
  "ABANDONED",
  "TIMEDOUT",
  "VOID",
  "RESTRICTED",
  "UNKNOWN",
])

export function getTapSecretKey(): string | null {
  return process.env.TAP_SECRET_KEY || null
}

export function isTapConfigured(): boolean {
  return Boolean(getTapSecretKey())
}

export type FetchTapChargeResult =
  | { ok: true; charge: TapCharge }
  | {
      ok: false
      reason: "not_configured" | "not_found" | "network" | "http"
      status?: number
      error?: string
    }

/**
 * Read a charge from Tap. Never throws — the caller decides what a failure
 * means (a webhook releases its dedupe row and asks Tap to retry; the return
 * page shows "still processing").
 */
export async function fetchTapCharge(
  chargeId: string
): Promise<FetchTapChargeResult> {
  const secretKey = getTapSecretKey()
  if (!secretKey) return { ok: false, reason: "not_configured" }
  if (!/^[A-Za-z0-9_]+$/.test(chargeId)) {
    return { ok: false, reason: "not_found" }
  }

  let response: Response
  try {
    response = await fetch(`${TAP_API_BASE}/charges/${chargeId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
    })
  } catch (err) {
    return {
      ok: false,
      reason: "network",
      error: err instanceof Error ? err.message : String(err),
    }
  }

  if (response.status === 404) return { ok: false, reason: "not_found" }
  if (!response.ok) {
    return { ok: false, reason: "http", status: response.status }
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    return { ok: false, reason: "http", status: response.status }
  }
  const charge = json as TapCharge
  if (!charge || typeof charge !== "object" || !charge.id || !charge.status) {
    return { ok: false, reason: "http", status: response.status }
  }
  return { ok: true, charge }
}

/** Format an amount the way Tap hashes it: fixed to the currency's minor units. */
export function formatTapHashAmount(
  amount: number | undefined,
  currency: string | undefined
): string {
  const value =
    typeof amount === "number" && Number.isFinite(amount) ? amount : 0
  return value.toFixed(getDecimalPlaces(currency ?? ""))
}

/** The exact string Tap HMACs for a charge/authorize/refund webhook. */
export function buildTapHashSource(charge: TapCharge): string {
  const created =
    charge.transaction?.created === undefined ||
    charge.transaction?.created === null
      ? ""
      : String(charge.transaction.created)
  return (
    `x_id${charge.id}` +
    `x_amount${formatTapHashAmount(charge.amount, charge.currency)}` +
    `x_currency${charge.currency ?? ""}` +
    `x_gateway_reference${charge.reference?.gateway ?? ""}` +
    `x_payment_reference${charge.reference?.payment ?? ""}` +
    `x_status${charge.status}` +
    `x_created${created}`
  )
}

export function computeTapHashstring(charge: TapCharge, secretKey: string) {
  return crypto
    .createHmac("sha256", secretKey)
    .update(buildTapHashSource(charge))
    .digest("hex")
}

/**
 * Constant-time compare of the posted `hashstring` header against our own
 * computation. `secretKey` is the Tap secret API key.
 */
export function verifyTapHashstring(
  charge: TapCharge,
  postedHash: string | null | undefined,
  secretKey: string
): boolean {
  if (!postedHash) return false
  const expected = computeTapHashstring(charge, secretKey)
  try {
    const a = Buffer.from(expected, "hex")
    const b = Buffer.from(postedHash.trim().toLowerCase(), "hex")
    if (a.length === 0 || a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Absolute URL Tap POSTs charge updates to. Tap refuses relative and
 * localhost URLs, so this must be a public origin: `NEXT_PUBLIC_APP_URL`
 * (the platform host) first, then the primary platform host as a fallback so
 * a missing env var degrades to a working ingress rather than a broken one.
 */
export function tapWebhookUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ||
    "https://ed.databayt.org"
  return `${base}/api/webhooks/tap`
}
