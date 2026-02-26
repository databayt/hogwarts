// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { PaymentGateway } from "./types"

// Country → preferred gateways (ordered by preference)
const COUNTRY_GATEWAYS: Record<string, PaymentGateway[]> = {
  SD: ["mobile_money", "cash", "bank_transfer"],
  EG: ["stripe", "cash", "bank_transfer"],
  SA: ["tap", "stripe", "cash", "bank_transfer"],
  AE: ["tap", "stripe", "cash", "bank_transfer"],
  JO: ["stripe", "cash", "bank_transfer"],
  KW: ["tap", "cash", "bank_transfer"],
  QA: ["tap", "stripe", "cash", "bank_transfer"],
  BH: ["tap", "stripe", "cash", "bank_transfer"],
  OM: ["tap", "cash", "bank_transfer"],
}

const DEFAULT_GATEWAYS: PaymentGateway[] = ["stripe", "cash"]

// Country → default currency
const COUNTRY_CURRENCIES: Record<string, string> = {
  SD: "SDG",
  EG: "EGP",
  SA: "SAR",
  AE: "AED",
  JO: "JOD",
  KW: "KWD",
  QA: "QAR",
  BH: "BHD",
  OM: "OMR",
  US: "USD",
  GB: "GBP",
  CA: "CAD",
  AU: "AUD",
}

// Timezone → country inference
const TIMEZONE_COUNTRY: Record<string, string> = {
  "Africa/Khartoum": "SD",
  "Africa/Cairo": "EG",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Asia/Amman": "JO",
  "Asia/Kuwait": "KW",
  "Asia/Qatar": "QA",
  "Asia/Bahrain": "BH",
  "Asia/Muscat": "OM",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "Europe/London": "GB",
}

function resolveCountry(
  schoolCountry?: string | null,
  schoolTimezone?: string | null
): string | undefined {
  if (schoolCountry) return schoolCountry
  if (schoolTimezone) return TIMEZONE_COUNTRY[schoolTimezone]
  return undefined
}

export function resolvePaymentGateways(
  schoolCountry?: string | null,
  schoolTimezone?: string | null
): PaymentGateway[] {
  const country = resolveCountry(schoolCountry, schoolTimezone)
  if (!country) return DEFAULT_GATEWAYS
  return COUNTRY_GATEWAYS[country] ?? DEFAULT_GATEWAYS
}

export function resolveDefaultCurrency(
  schoolCountry?: string | null,
  schoolTimezone?: string | null
): string {
  const country = resolveCountry(schoolCountry, schoolTimezone)
  if (!country) return "USD"
  return COUNTRY_CURRENCIES[country] ?? "USD"
}
