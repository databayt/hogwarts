import { describe, expect, it } from "vitest"

import {
  isAppVersionRefused,
  parseMinVersion,
  updateRequiredBody,
} from "@/lib/mobile-app-version"

const r = (header: string | null | undefined, min = 10, pathname = "/api/mobile/timetable") =>
  isAppVersionRefused({ pathname, header, min })

describe("isAppVersionRefused", () => {
  it("refuses below the minimum", () => expect(r("9")).toBe(true))
  it("allows equal and above", () => {
    expect(r("10")).toBe(false)
    expect(r("11")).toBe(false)
  })
  it("never blocks a missing or garbage header", () => {
    for (const h of [null, undefined, "", "abc", "1.3.3", "-5", "9x"])
      expect(r(h)).toBe(false)
  })
  it("is off when the minimum is 0", () => expect(r("1", 0)).toBe(false))
  it("exempts auth and update routes", () => {
    for (const p of [
      "/api/mobile/auth",
      "/api/mobile/auth/logout",
      "/api/mobile/auth/google",
      "/api/mobile/update",
      "/api/mobile/version",
    ])
      expect(r("1", 10, p)).toBe(false)
    expect(r("1", 10, "/api/mobile/authx")).toBe(true)
  })
  it("only concerns /api/mobile", () => {
    expect(r("1", 10, "/api/other")).toBe(false)
  })
})

describe("parseMinVersion / body", () => {
  it("parses", () => {
    expect(parseMinVersion("14")).toBe(14)
    expect(parseMinVersion(undefined)).toBe(0)
    expect(parseMinVersion("")).toBe(0)
    expect(parseMinVersion("x")).toBe(0)
    expect(parseMinVersion("-3")).toBe(0)
  })
  it("builds the 426 body", () => {
    const b = updateRequiredBody(14, "ar")
    expect(b.error).toBe("update_required")
    expect(b.minVersion).toBe(14)
    expect(b.message).toContain("حدّث")
    expect(updateRequiredBody(14, "en-US").message).not.toContain("حدّث")
  })
})
