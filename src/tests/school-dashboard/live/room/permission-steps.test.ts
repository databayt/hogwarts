// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { describe, expect, it } from "vitest"

import { deviceFailureKind } from "@/components/school-dashboard/live/room/permission-guide"
import {
  detectBrowser,
  stepsFor,
} from "@/components/school-dashboard/live/room/permission-steps"
import { DEFAULT_ROOM_LABELS } from "@/components/school-dashboard/live/room/labels"
import ar from "@/components/internationalization/dictionaries/ar/live-classes.json"
import en from "@/components/internationalization/dictionaries/en/live-classes.json"

const UA = {
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
  samsung:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36",
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.0.0 Mobile/15E148 Safari/604.1",
  whatsapp:
    "Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.0.0 Mobile Safari/537.36 WhatsApp/2.24",
  desktopChrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  macSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  firefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
}

describe("detectBrowser", () => {
  it("names the visitor's real browser", () => {
    expect(detectBrowser(UA.androidChrome)).toBe("chrome-android")
    expect(detectBrowser(UA.samsung)).toBe("samsung")
    expect(detectBrowser(UA.iphoneSafari)).toBe("safari-ios")
    expect(detectBrowser(UA.iphoneChrome)).toBe("chrome-ios")
    expect(detectBrowser(UA.whatsapp)).toBe("in-app")
    expect(detectBrowser(UA.desktopChrome)).toBe("chrome-desktop")
    expect(detectBrowser(UA.macSafari)).toBe("safari-mac")
    expect(detectBrowser(UA.firefox)).toBe("firefox")
    expect(detectBrowser("")).toBe("other")
  })
})

describe("stepsFor", () => {
  it("every step key exists in the defaults and both dictionaries", () => {
    const browsers = [
      "in-app", "chrome-android", "samsung", "safari-ios", "chrome-ios",
      "chrome-desktop", "safari-mac", "firefox", "other",
    ] as const
    for (const b of browsers)
      for (const key of stepsFor(b, "mic")) {
        expect(key in DEFAULT_ROOM_LABELS).toBe(true)
        expect(typeof (ar.room as Record<string, string>)[key]).toBe("string")
        expect(typeof (en.room as Record<string, string>)[key]).toBe("string")
      }
  })

  it("Android Chrome ends with the phone-settings fallback", () => {
    const steps = stepsFor("chrome-android", "camera")
    expect(steps[steps.length - 1]).toBe("permChromeAndroidFallback")
    expect(steps.length).toBe(4)
  })

  it("ar and en carry the same permission keys", () => {
    const keys = (o: object) => Object.keys(o).filter((k) => k.startsWith("perm")).sort()
    expect(keys(ar.room)).toEqual(keys(en.room))
  })
})

describe("camera failures are classified like the microphone's", () => {
  const err = (name: string) => Object.assign(new Error(name), { name })
  it("maps browser error names", () => {
    expect(deviceFailureKind(err("NotAllowedError"))).toBe("denied")
    expect(deviceFailureKind(err("NotFoundError"))).toBe("missing")
    expect(deviceFailureKind(err("NotReadableError"))).toBe("in-use")
    expect(deviceFailureKind(err("Weird"))).toBe("failed")
  })
})
