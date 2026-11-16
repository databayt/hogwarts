import { describe, expect, it } from "vitest"

import {
  ANDROID_APP_URL,
  apkUrlFor,
  buildIntentUrl,
  classifyUserAgent,
  isInAppBrowser,
  subdomainOf,
} from "@/components/school-dashboard/live/android-app"

const CHROME =
  "Mozilla/5.0 (Linux; Android 13; SM-A135F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
const WV =
  "Mozilla/5.0 (Linux; Android 12; SM-A125F; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.0.0 Mobile Safari/537.36"
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"

describe("classifyUserAgent", () => {
  it("android chrome", () => expect(classifyUserAgent(CHROME)).toBe("android"))
  it("android webview", () => {
    expect(classifyUserAgent(WV)).toBe("android-webview")
    expect(classifyUserAgent(CHROME + " WhatsApp/2.24")).toBe("android-webview")
    expect(classifyUserAgent(CHROME + " [FBAN/FB4A;FBAV/1]")).toBe("android-webview")
  })
  it("other", () => {
    expect(classifyUserAgent(IPHONE)).toBe("other")
    expect(classifyUserAgent("")).toBe("other")
    expect(classifyUserAgent(null)).toBe("other")
    expect(isInAppBrowser(IPHONE + " Instagram 300")).toBe(true)
  })
})

describe("urls", () => {
  it("picks the school apk", () => {
    expect(apkUrlFor("alabidae")).toContain("/alabidae/alabidae.apk")
    expect(apkUrlFor("other")).toBe(ANDROID_APP_URL)
    expect(apkUrlFor(null)).toBe(ANDROID_APP_URL)
    expect(subdomainOf("alabidae.balqalam.com")).toBe("alabidae")
    expect(subdomainOf("localhost:3000")).toBeNull()
  })
  it("builds the intent", () => {
    const u = buildIntentUrl("alabidae.balqalam.com", "/ar/live/1/room", ANDROID_APP_URL)
    expect(u).toBe(
      "intent://alabidae.balqalam.com/ar/live/1/room#Intent;scheme=https;package=org.hogwarts.android;S.browser_fallback_url=" +
        encodeURIComponent(ANDROID_APP_URL) +
        ";end"
    )
  })
})
