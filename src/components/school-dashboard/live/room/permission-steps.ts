// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A blocked microphone or camera is fixed in the BROWSER'S settings, and every
 * browser hides that switch somewhere else. Pure helpers (no DOM) so the right
 * steps for the visitor's actual browser unit-test on real user-agent strings.
 */

export type BrowserKind =
  | "in-app"
  | "chrome-android"
  | "samsung"
  | "safari-ios"
  | "chrome-ios"
  | "chrome-desktop"
  | "safari-mac"
  | "firefox"
  | "other"

export type DeviceKind = "mic" | "camera"

/** WhatsApp / Facebook / Instagram / Android WebView: no microphone at all. */
const IN_APP = /; wv\)|WhatsApp|FBAN|FBAV|Instagram/i

export function detectBrowser(ua: string | null | undefined): BrowserKind {
  if (!ua) return "other"
  if (IN_APP.test(ua)) return "in-app"
  if (/SamsungBrowser/i.test(ua)) return "samsung"
  if (/iPhone|iPad|iPod/i.test(ua)) {
    if (/CriOS/i.test(ua)) return "chrome-ios"
    if (/FxiOS/i.test(ua)) return "other"
    return "safari-ios"
  }
  if (/Firefox/i.test(ua)) return "firefox"
  if (/Android/i.test(ua)) return /Chrome|CriOS/i.test(ua) ? "chrome-android" : "other"
  if (/Chrome|Chromium|Edg\//i.test(ua)) return "chrome-desktop"
  if (/Safari/i.test(ua)) return "safari-mac"
  return "other"
}

/**
 * Dictionary keys (under `liveClasses.room`), in reading order. Each string
 * carries `{device}` — the permission's name as the browser shows it.
 */
export function stepsFor(browser: BrowserKind, _kind: DeviceKind): string[] {
  switch (browser) {
    case "chrome-android":
      return [
        "permChromeAndroid1",
        "permChromeAndroid2",
        "permChromeAndroid3",
        "permChromeAndroidFallback",
      ]
    case "samsung":
      return [
        "permSamsung1",
        "permSamsung2",
        "permSamsung3",
        "permSamsungFallback",
      ]
    case "safari-ios":
      return [
        "permSafariIos1",
        "permSafariIos2",
        "permSafariIos3",
        "permSafariIosFallback",
      ]
    case "chrome-ios":
      return ["permChromeIos1", "permChromeIos2", "permChromeIosFallback"]
    case "chrome-desktop":
      return ["permDesktop1", "permDesktop2", "permDesktopFallback"]
    case "safari-mac":
      return ["permSafariMac1", "permSafariMac2", "permMacFallback"]
    case "firefox":
      return ["permDesktop1", "permFirefox2", "permDesktopFallback"]
    case "in-app":
      return ["micInAppBrowser"]
    default:
      return ["permOther1", "permOther2"]
  }
}
