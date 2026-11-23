import { describe, expect, it } from "vitest"

import {
  buildGateIntentUrl,
  hasAppFlag,
  parseCookies,
  schoolDateString,
  shouldGate,
} from "@/components/school-dashboard/live/android-gate"

const PHONE =
  "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
const TABLET =
  "Mozilla/5.0 (Linux; Android 12; SM-X200) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15"
const CROS =
  "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
const TODAY = "2026-11-23"
const base = { ua: PHONE, isAppSchool: true, cookies: {}, todayInSchoolZone: TODAY }

describe("shouldGate", () => {
  it("gates an Android phone and tablet", () => {
    expect(shouldGate(base)).toBe(true)
    expect(shouldGate({ ...base, ua: TABLET })).toBe(true)
  })
  it("never gates iOS, desktop or ChromeOS", () => {
    for (const ua of [IPHONE, MAC, CROS, "", null])
      expect(shouldGate({ ...base, ua })).toBe(false)
  })
  it("lets the app's own visits through", () => {
    expect(shouldGate({ ...base, cookies: { bq_app: "1" } })).toBe(false)
    expect(shouldGate({ ...base, cookies: { bq_app: "0" } })).toBe(true)
  })
  it("lets today's escape through, not yesterday's", () => {
    expect(shouldGate({ ...base, cookies: { bq_web_ok: TODAY } })).toBe(false)
    expect(shouldGate({ ...base, cookies: { bq_web_ok: "2026-11-22" } })).toBe(true)
  })
  it("ignores a school without its own app", () => {
    expect(shouldGate({ ...base, isAppSchool: false })).toBe(false)
  })
})

describe("helpers", () => {
  it("reads the app flag", () => {
    expect(hasAppFlag("?app=1")).toBe(true)
    expect(hasAppFlag("?x=2&from=app")).toBe(true)
    expect(hasAppFlag("?app=0")).toBe(false)
    expect(hasAppFlag("")).toBe(false)
  })
  it("parses cookies", () => {
    expect(parseCookies("a=1; bq_web_ok=2026-11-23; b=x%20y")).toEqual({
      a: "1",
      bq_web_ok: "2026-11-23",
      b: "x y",
    })
    expect(parseCookies("")).toEqual({})
  })
  it("dates the school's day in its own zone", () => {
    // 22:30 UTC on 11-22 is already 00:30 on 11-23 in Khartoum (UTC+2)
    const at = Date.UTC(2026, 10, 22, 22, 30)
    expect(schoolDateString("Africa/Khartoum", at)).toBe("2026-11-23")
    expect(schoolDateString("UTC", at)).toBe("2026-11-22")
  })
})

describe("buildGateIntentUrl", () => {
  const apk = "https://cdn.databayt.org/balqalam/app/alabidae/alabidae.apk"
  const url = buildGateIntentUrl(
    "alabidae.balqalam.com",
    "/ar/live/abc",
    "?x=1&y=2",
    apk
  )
  it("keeps host, path and query", () => {
    expect(url.startsWith("intent://alabidae.balqalam.com/ar/live/abc?x=1&y=2#Intent;")).toBe(true)
    expect(url).toContain("scheme=https;package=org.hogwarts.android;")
  })
  it("encodes the fallback", () => {
    expect(url).toContain(`S.browser_fallback_url=${encodeURIComponent(apk)};end`)
  })
})
