// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { FALLBACK_RATES, type Rates } from "./rates"

export interface LiveRates {
  rates: Rates
  /** ISO date of the feed's last update, or null when on the fallback. */
  updated: string | null
}

/**
 * Today's SAR exchange rates for the pricing page and the chatbot — the
 * free open.er-api.com feed (no key), cached for a day. A slow or failed
 * feed never blocks the page: it falls back to the pinned rates.
 */
export async function getExchangeRates(): Promise<LiveRates> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/SAR", {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = (await res.json()) as {
      result?: string
      time_last_update_unix?: number
      rates?: Record<string, number>
    }
    const r = data.rates
    if (data.result !== "success" || !r?.USD || !r.SDG || !r.EGP) {
      throw new Error("incomplete rates")
    }
    return {
      rates: { SAR: 1, USD: r.USD, SDG: r.SDG, EGP: r.EGP },
      updated: data.time_last_update_unix
        ? new Date(data.time_last_update_unix * 1000).toISOString()
        : null,
    }
  } catch (error) {
    console.error("Exchange rates unavailable, using fallback:", error)
    return { rates: FALLBACK_RATES, updated: null }
  }
}
