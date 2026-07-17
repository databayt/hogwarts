// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { resolveSchoolCountry } from "@/lib/school-country"

describe("resolveSchoolCountry — deterministic, fail-safe chain", () => {
  it("uses an explicit ISO-2 country verbatim (upper-cased)", () => {
    expect(resolveSchoolCountry({ country: "SD" })).toBe("SD")
    expect(resolveSchoolCountry({ country: "ae" })).toBe("AE")
    expect(resolveSchoolCountry({ country: " sa " })).toBe("SA")
  })

  it("normalises common free-text country names (legacy rows)", () => {
    expect(resolveSchoolCountry({ country: "Sudan" })).toBe("SD")
    expect(resolveSchoolCountry({ country: "United Arab Emirates" })).toBe("AE")
    expect(resolveSchoolCountry({ country: "UAE" })).toBe("AE")
    expect(resolveSchoolCountry({ country: "KSA" })).toBe("SA")
  })

  it("falls back to timezone when country is missing", () => {
    expect(resolveSchoolCountry({ timezone: "Africa/Khartoum" })).toBe("SD")
    expect(resolveSchoolCountry({ timezone: "Asia/Dubai" })).toBe("AE")
  })

  it("falls back to an UNAMBIGUOUS currency only", () => {
    expect(resolveSchoolCountry({ currency: "SDG" })).toBe("SD")
    expect(resolveSchoolCountry({ currency: "AED" })).toBe("AE")
    // Multi-country currencies must NOT resolve a country (would be a guess).
    expect(resolveSchoolCountry({ currency: "USD" })).toBeNull()
    expect(resolveSchoolCountry({ currency: "EUR" })).toBeNull()
  })

  it("prefers country > timezone > currency", () => {
    // Conflicting signals: explicit country wins.
    expect(
      resolveSchoolCountry({
        country: "AE",
        timezone: "Africa/Khartoum",
        currency: "SDG",
      })
    ).toBe("AE")
    // Unknown free-text country falls through to timezone rather than trusting it.
    expect(
      resolveSchoolCountry({ country: "Atlantis", timezone: "Asia/Dubai" })
    ).toBe("AE")
  })

  it("returns null when nothing resolves — never guesses", () => {
    expect(resolveSchoolCountry({})).toBeNull()
    expect(resolveSchoolCountry({ country: null })).toBeNull()
    expect(
      resolveSchoolCountry({ country: "Nowhere", currency: "USD" })
    ).toBeNull()
    expect(resolveSchoolCountry({ timezone: "Mars/Olympus" })).toBeNull()
  })
})
