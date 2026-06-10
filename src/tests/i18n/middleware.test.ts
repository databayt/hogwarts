// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Locale-detection precedence tests against the LIVE implementation.
 *
 * `detectLocale` / `pathnameHasLocale` (locale-detect.ts) are the exact
 * functions `src/proxy.ts` runs at the edge — these used to test a dead
 * negotiator-based reference middleware that was never wired (deleted).
 * Precedence: valid NEXT_LOCALE cookie → first Accept-Language tag → "ar".
 */
import { describe, expect, it } from "vitest"

import {
  detectLocale,
  pathnameHasLocale,
} from "@/components/internationalization/locale-detect"

describe("detectLocale (live proxy logic)", () => {
  describe("cookie-based locale", () => {
    it("uses NEXT_LOCALE cookie when set to en", () => {
      expect(detectLocale({ cookieLocale: "en" })).toBe("en")
    })

    it("uses NEXT_LOCALE cookie when set to ar", () => {
      expect(detectLocale({ cookieLocale: "ar" })).toBe("ar")
    })

    it("cookie wins over a conflicting Accept-Language header", () => {
      expect(
        detectLocale({ cookieLocale: "ar", acceptLanguage: "en-US,en;q=0.9" })
      ).toBe("ar")
    })

    it("ignores invalid cookie locale and falls back to Accept-Language", () => {
      expect(
        detectLocale({ cookieLocale: "fr", acceptLanguage: "en-US,en;q=0.9" })
      ).toBe("en")
    })
  })

  describe("Accept-Language header detection", () => {
    it("detects en when Accept-Language prefers English", () => {
      expect(detectLocale({ acceptLanguage: "en-US,en;q=0.9" })).toBe("en")
    })

    it("detects ar when Accept-Language prefers Arabic", () => {
      expect(detectLocale({ acceptLanguage: "ar-SA,ar;q=0.9" })).toBe("ar")
    })

    it("reduces a regioned tag to its base language", () => {
      expect(detectLocale({ acceptLanguage: "en-GB" })).toBe("en")
    })

    it("is case-insensitive", () => {
      expect(detectLocale({ acceptLanguage: "EN-us" })).toBe("en")
    })

    it("falls back to default (ar) for unsupported languages", () => {
      expect(detectLocale({ acceptLanguage: "fr-FR,de;q=0.9" })).toBe("ar")
    })

    it("only considers the FIRST tag (lightweight edge parse)", () => {
      // fr is first and unsupported — en later in the list is NOT consulted.
      expect(detectLocale({ acceptLanguage: "fr-FR,en;q=0.9" })).toBe("ar")
    })
  })

  describe("default fallback", () => {
    it("falls back to ar with no cookie and no header", () => {
      expect(detectLocale({})).toBe("ar")
    })

    it("falls back to ar with null inputs", () => {
      expect(detectLocale({ cookieLocale: null, acceptLanguage: null })).toBe(
        "ar"
      )
    })
  })
})

describe("pathnameHasLocale (live proxy logic)", () => {
  it("true for /ar/dashboard and /en/dashboard", () => {
    expect(pathnameHasLocale("/ar/dashboard")).toBe(true)
    expect(pathnameHasLocale("/en/dashboard")).toBe(true)
  })

  it("true for bare locale paths /ar and /en", () => {
    expect(pathnameHasLocale("/ar")).toBe(true)
    expect(pathnameHasLocale("/en")).toBe(true)
  })

  it("false for paths without a locale segment", () => {
    expect(pathnameHasLocale("/")).toBe(false)
    expect(pathnameHasLocale("/dashboard")).toBe(false)
    expect(pathnameHasLocale("/s/demo/dashboard/students")).toBe(false)
  })

  it("false for lookalike segments (/arabic, /english)", () => {
    expect(pathnameHasLocale("/arabic/page")).toBe(false)
    expect(pathnameHasLocale("/english")).toBe(false)
  })
})
