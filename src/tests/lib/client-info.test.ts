// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  clientFromLiveKit,
  parseAppVersion,
  platformFromHeaders,
  platformFromUserAgent,
} from "@/lib/client-info"

const UA = {
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; SM-A546B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  // Chrome "Desktop site" on a phone: the UA drops Android.
  androidDesktopSite:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  iphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  ipad: "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  windows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  cros: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  desktopLinux:
    "Mozilla/5.0 (X11; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0",
}

describe("platformFromUserAgent", () => {
  it("Android Chrome mobile", () => {
    expect(platformFromUserAgent(UA.androidChrome)).toBe("android")
  })
  it("Chrome desktop site on Android: Linux UA + mobile hint -> android", () => {
    expect(platformFromUserAgent(UA.androidDesktopSite, { mobile: true })).toBe(
      "android"
    )
  })
  it("Chrome desktop site: the platform hint alone says Android (quoted)", () => {
    expect(
      platformFromUserAgent(UA.androidDesktopSite, { platform: '"Android"' })
    ).toBe("android")
  })
  it("the same Linux UA without a mobile hint is real linux", () => {
    expect(platformFromUserAgent(UA.androidDesktopSite)).toBe("linux")
    expect(platformFromUserAgent(UA.desktopLinux, { mobile: false })).toBe(
      "linux"
    )
  })
  it("iPhone and iPad are ios", () => {
    expect(platformFromUserAgent(UA.iphone)).toBe("ios")
    expect(platformFromUserAgent(UA.ipad)).toBe("ios")
  })
  it("Windows, Mac, ChromeOS", () => {
    expect(platformFromUserAgent(UA.windows)).toBe("windows")
    expect(platformFromUserAgent(UA.mac)).toBe("mac")
    expect(platformFromUserAgent(UA.cros)).toBe("chromeos")
  })
  it("CrOS wins over its Linux/X11 token", () => {
    expect(platformFromUserAgent(UA.cros, { mobile: true })).toBe("chromeos")
  })
  it("empty or unknown agent is other", () => {
    expect(platformFromUserAgent("")).toBe("other")
    expect(platformFromUserAgent(null)).toBe("other")
    expect(platformFromUserAgent("curl/8.0")).toBe("other")
  })
})

describe("platformFromHeaders", () => {
  it("reads user-agent + sec-ch-ua-platform + sec-ch-ua-mobile", () => {
    const h = new Headers({
      "user-agent": UA.androidDesktopSite,
      "sec-ch-ua-mobile": "?1",
    })
    expect(platformFromHeaders(h)).toBe("android")
    expect(platformFromHeaders(new Headers({ "user-agent": UA.windows }))).toBe(
      "windows"
    )
  })
})

describe("clientFromLiveKit", () => {
  it("Android SDK (by name or enum value) is the app on android", () => {
    expect(clientFromLiveKit({ sdk: "ANDROID", os: "android" })).toEqual({
      client: "app",
      platform: "android",
    })
    expect(clientFromLiveKit({ sdk: 3, os: "Android" })).toEqual({
      client: "app",
      platform: "android",
    })
    expect(clientFromLiveKit({ sdk: 3 })).toEqual({
      client: "app",
      platform: "android",
    })
  })
  it("JS SDK is web, with the os mapped", () => {
    const cases: [string, string][] = [
      ["android", "android"],
      ["Android", "android"],
      ["ios", "ios"],
      ["windows", "windows"],
      ["mac os x", "mac"],
      ["linux", "linux"],
      ["chrome os", "chromeos"],
      ["", "other"],
    ]
    for (const [os, platform] of cases) {
      expect(clientFromLiveKit({ sdk: "JS", os })).toEqual({
        client: "web",
        platform,
      })
    }
    expect(clientFromLiveKit({ sdk: 1, os: "android" })).toEqual({
      client: "web",
      platform: "android",
    })
  })
  it("Swift SDK is the app on ios; Flutter keeps the reported os", () => {
    expect(clientFromLiveKit({ sdk: "SWIFT" })).toEqual({
      client: "app",
      platform: "ios",
    })
    expect(clientFromLiveKit({ sdk: 4, os: "android" })).toEqual({
      client: "app",
      platform: "android",
    })
  })
  it("server SDKs and unknowns are not a client", () => {
    expect(clientFromLiveKit({ sdk: "GO", os: "linux" })).toBeNull()
    expect(clientFromLiveKit({ sdk: 0 })).toBeNull()
    expect(clientFromLiveKit({})).toBeNull()
  })
})

describe("parseAppVersion", () => {
  it("parses a build number", () => {
    expect(parseAppVersion("15")).toBe(15)
    expect(parseAppVersion(" 17 ")).toBe(17)
    expect(parseAppVersion("18 (debug)")).toBe(18)
  })
  it("null on absent or garbled", () => {
    expect(parseAppVersion(null)).toBeNull()
    expect(parseAppVersion(undefined)).toBeNull()
    expect(parseAppVersion("")).toBeNull()
    expect(parseAppVersion("abc")).toBeNull()
    expect(parseAppVersion("-3")).toBeNull()
  })
})
