import { describe, expect, it } from "vitest"

import {
  buildGateIntentUrl,
  hasAppFlag,
  isAndroidDevice,
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
const DESKTOP_SITE =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const IPAD =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
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
  it("lets only a tab marked by the app through", () => {
    expect(shouldGate({ ...base, appMark: true })).toBe(false)
    expect(shouldGate({ ...base, appMark: false })).toBe(true)
  })
  it("no longer trusts the old bq_app cookie", () => {
    expect(shouldGate({ ...base, cookies: { bq_app: "1" } })).toBe(true)
  })
  it("gates Chrome's desktop-site mode on a touch phone", () => {
    const d = { ...base, ua: DESKTOP_SITE, maxTouchPoints: 5, screenMin: 412 }
    expect(shouldGate(d)).toBe(true)
  })
  it("gates when client hints say Android", () => {
    expect(shouldGate({ ...base, ua: DESKTOP_SITE, uaPlatform: "Android" })).toBe(true)
  })
  it("lets today's escape through, not yesterday's", () => {
    expect(shouldGate({ ...base, cookies: { bq_web_ok: TODAY } })).toBe(false)
    expect(shouldGate({ ...base, cookies: { bq_web_ok: "2026-11-22" } })).toBe(true)
  })
  it("ignores a school without its own app", () => {
    expect(shouldGate({ ...base, isAppSchool: false })).toBe(false)
  })
})

describe("isAndroidDevice", () => {
  it("plain Android UAs", () => {
    expect(isAndroidDevice({ ua: PHONE })).toBe(true)
  })
  it("desktop-site mode: Linux UA + touch + small screen", () => {
    expect(
      isAndroidDevice({ ua: DESKTOP_SITE, maxTouchPoints: 5, screenMin: 412 })
    ).toBe(true)
    expect(
      isAndroidDevice({ ua: DESKTOP_SITE, maxTouchPoints: 5, screenMin: 900 })
    ).toBe(true)
  })
  it("a real Linux desktop is not gated", () => {
    expect(isAndroidDevice({ ua: DESKTOP_SITE, maxTouchPoints: 0, screenMin: 1080 })).toBe(false)
    // touch laptop with a big screen
    expect(isAndroidDevice({ ua: DESKTOP_SITE, maxTouchPoints: 10, screenMin: 1080 })).toBe(false)
    expect(isAndroidDevice({ ua: DESKTOP_SITE })).toBe(false)
  })
  it("ChromeOS is not gated even with touch", () => {
    expect(isAndroidDevice({ ua: CROS, maxTouchPoints: 10, screenMin: 800 })).toBe(false)
  })
  it("iPad is not gated", () => {
    expect(isAndroidDevice({ ua: IPAD, maxTouchPoints: 5, screenMin: 820 })).toBe(false)
    expect(isAndroidDevice({ ua: IPHONE, maxTouchPoints: 5, screenMin: 390 })).toBe(false)
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

describe("buildHandoffIntentUrl", () => {
  const apk = "https://cdn.databayt.org/balqalam/app/alabidae/alabidae.apk"
  it("appends the code to the target, keeping path and query", async () => {
    const { buildHandoffIntentUrl } = await import(
      "@/components/school-dashboard/live/android-gate"
    )
    const url = buildHandoffIntentUrl("a.balqalam.com", "/ar/live/abc", "?x=1", apk, "CODE_1")
    expect(url.startsWith("intent://a.balqalam.com/ar/live/abc?x=1&app_login=CODE_1#Intent;")).toBe(true)
  })
  it("keeps the fallback untouched and free of the code", async () => {
    const { buildHandoffIntentUrl } = await import(
      "@/components/school-dashboard/live/android-gate"
    )
    const url = buildHandoffIntentUrl("a.balqalam.com", "/ar", "", apk, "CODE_1")
    expect(url).toContain(`S.browser_fallback_url=${encodeURIComponent(apk)};end`)
    expect(url.split("S.browser_fallback_url")[1]).not.toContain("CODE_1")
  })
  it("without a code equals the plain gate url", async () => {
    const { buildHandoffIntentUrl, buildGateIntentUrl } = await import(
      "@/components/school-dashboard/live/android-gate"
    )
    expect(buildHandoffIntentUrl("h", "/p", "?q=1", apk, null)).toBe(
      buildGateIntentUrl("h", "/p", "?q=1", apk)
    )
  })
})
