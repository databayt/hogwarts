// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it } from "vitest"

import { sanitizePageUrl } from "@/lib/report/sanitize"

describe("sanitizePageUrl", () => {
  it("drops the one-time token of a reset link", () => {
    expect(
      sanitizePageUrl(
        "https://alabidae.balqalam.com/ar/new-password?token=9f8c2d1e-secret"
      )
    ).toBe("https://alabidae.balqalam.com/ar/new-password")
  })

  it("drops the verification token and its callback", () => {
    const out = sanitizePageUrl(
      "https://balqalam.com/en/new-verification?token=abc123&callbackUrl=%2Fen%2Fdashboard"
    )
    expect(out).toBe("https://balqalam.com/en/new-verification")
    expect(out).not.toContain("abc123")
  })

  it("drops search terms and filters", () => {
    expect(
      sanitizePageUrl(
        "https://demo.balqalam.com/ar/students?search=%D8%A3%D8%AD%D9%85%D8%AF&grade=7"
      )
    ).toBe("https://demo.balqalam.com/ar/students")
  })

  it("drops the fragment", () => {
    expect(
      sanitizePageUrl("https://demo.balqalam.com/ar/live#access_token=xyz")
    ).toBe("https://demo.balqalam.com/ar/live")
  })

  it("drops credentials in the authority", () => {
    expect(
      sanitizePageUrl("https://user:pass@demo.balqalam.com/ar/x?y=1")
    ).toBe("https://demo.balqalam.com/ar/x")
  })

  it("keeps the host, the port and the path as they are", () => {
    expect(sanitizePageUrl("http://demo.localhost:3000/ar/timetable")).toBe(
      "http://demo.localhost:3000/ar/timetable"
    )
    expect(
      sanitizePageUrl("https://alabidae.balqalam.com/ar/live/cmw9t39x1/room")
    ).toBe("https://alabidae.balqalam.com/ar/live/cmw9t39x1/room")
  })

  it("leaves a clean address untouched and trims spaces", () => {
    expect(sanitizePageUrl("  https://balqalam.com/ar  ")).toBe(
      "https://balqalam.com/ar"
    )
  })

  it("hands on what is not an http address, for the schema to reject", () => {
    expect(sanitizePageUrl("")).toBe("")
    expect(sanitizePageUrl("not a url")).toBe("not a url")
    expect(sanitizePageUrl("javascript:alert(1)")).toBe("javascript:alert(1)")
  })
})
