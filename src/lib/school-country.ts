// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Resolve a school's ISO-3166 alpha-2 country from the location data it already
 * carries, so country-scoped rules (payroll tax, social security, statutory
 * formats) can default from where the school actually is.
 *
 * Onboarding enforces an ISO-2 country (onboarding/location/validation.ts), so
 * for any school created through the product `School.country` is already clean.
 * The fallbacks exist for legacy/imported rows where it is free text or null.
 *
 * FAIL-SAFE CONTRACT: this returns `null` rather than guessing a country when it
 * can't resolve one. Callers must treat `null` as "no country" and refuse to
 * apply any specific country's rules — never fall back to a default country. A
 * blocked payroll run is recoverable; the wrong tax withheld from staff pay is
 * not. (This is a generalisation of the resolveCountry helper already living in
 * src/lib/payment/gateway-config.ts, which that module can adopt later.)
 */

/** IANA timezone → ISO-3166 alpha-2 (superset of gateway-config's map). */
const TIMEZONE_TO_ISO2: Record<string, string> = {
  "Africa/Khartoum": "SD",
  "Africa/Cairo": "EG",
  "Asia/Riyadh": "SA",
  "Asia/Dubai": "AE",
  "Asia/Amman": "JO",
  "Asia/Kuwait": "KW",
  "Asia/Qatar": "QA",
  "Asia/Bahrain": "BH",
  "Asia/Muscat": "OM",
  "Asia/Beirut": "LB",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "Europe/London": "GB",
}

/**
 * Currency → ISO-2, ONLY where a currency maps to exactly one supported
 * country. Multi-country currencies (USD, EUR, GBP, XOF, …) are deliberately
 * absent: inferring a country from them would be a guess, and this resolver
 * never guesses.
 */
const CURRENCY_TO_ISO2: Record<string, string> = {
  SDG: "SD",
  AED: "AE",
  SAR: "SA",
  EGP: "EG",
  JOD: "JO",
  KWD: "KW",
  QAR: "QA",
  BHD: "BH",
  OMR: "OM",
}

/**
 * Small curated map from common free-text country names to ISO-2, for legacy
 * rows that predate the onboarding ISO-2 constraint. Not a full ISO-3166
 * library — just the markets we operate in, plus obvious variants.
 */
const NAME_TO_ISO2: Record<string, string> = {
  sudan: "SD",
  "south sudan": "SS",
  sdn: "SD",
  "united arab emirates": "AE",
  uae: "AE",
  emirates: "AE",
  "saudi arabia": "SA",
  ksa: "SA",
  "kingdom of saudi arabia": "SA",
  egypt: "EG",
  jordan: "JO",
  kuwait: "KW",
  qatar: "QA",
  bahrain: "BH",
  oman: "OM",
  lebanon: "LB",
}

export interface SchoolLocationFields {
  country?: string | null
  timezone?: string | null
  currency?: string | null
}

/**
 * Deterministic resolution chain: explicit ISO-2 country → normalised free-text
 * name → timezone → unambiguous currency → null. Never guesses.
 */
export function resolveSchoolCountry(
  school: SchoolLocationFields
): string | null {
  const raw = school.country?.trim()
  if (raw) {
    // Already ISO-2?
    if (/^[A-Za-z]{2}$/.test(raw)) return raw.toUpperCase()
    // Legacy free text → curated alias map.
    const byName = NAME_TO_ISO2[raw.toLowerCase()]
    if (byName) return byName
    // Unknown free text: fall through to structural inference below rather than
    // trusting a string we can't validate.
  }

  if (school.timezone) {
    const byTz = TIMEZONE_TO_ISO2[school.timezone]
    if (byTz) return byTz
  }

  if (school.currency) {
    const byCurrency = CURRENCY_TO_ISO2[school.currency.trim().toUpperCase()]
    if (byCurrency) return byCurrency
  }

  return null
}
