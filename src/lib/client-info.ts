// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * How a person reaches the platform: the native app or the web, and on which
 * OS. Pure helpers (no db, no request objects) so they unit-test cleanly.
 *
 * Three sources feed the same vocabulary:
 *  - the HTTP request (`platformFromUserAgent`) — a best guess at token time;
 *  - the LiveKit SDK's own `ClientInfo` (`clientFromLiveKit`) — the truth once
 *    the person is in the room (it sees through Chrome's "desktop site");
 *  - the app's `X-App-Version` header (`parseAppVersion`).
 */

export type ClientKind = "app" | "web"

export const PLATFORMS = [
  "android",
  "ios",
  "windows",
  "mac",
  "chromeos",
  "linux",
  "other",
] as const
export type Platform = (typeof PLATFORMS)[number]

export type ClientInfo = {
  client: ClientKind
  platform: Platform
  /** Only meaningful for `client: "app"`. */
  appVersion?: number | null
}

/** Client hints the server can read: `sec-ch-ua-platform` / `sec-ch-ua-mobile`. */
export type PlatformHints = {
  /** `sec-ch-ua-platform`, quotes allowed: `"Android"`. */
  platform?: string | null
  /** `sec-ch-ua-mobile === "?1"`. */
  mobile?: boolean | null
}

function stripQuotes(v: string | null | undefined): string {
  return (v ?? "").replace(/"/g, "").trim()
}

/**
 * The OS from a User-Agent (+ optional client hints).
 *
 * Android when the UA says Android, OR the client-hint platform is Android, OR
 * the UA is desktop Linux while the hint says mobile (Chrome's "desktop site"
 * on a phone sends `Linux x86_64`). iPhone/iPad are iOS; "Macintosh" is mac —
 * an iPad in desktop mode is indistinguishable server-side, so it stays mac.
 */
export function platformFromUserAgent(
  ua: string | null | undefined,
  hints?: PlatformHints
): Platform {
  const agent = ua ?? ""
  const hintPlatform = stripQuotes(hints?.platform).toLowerCase()

  if (/CrOS/i.test(agent) || hintPlatform === "chrome os") return "chromeos"
  if (/Android/i.test(agent) || hintPlatform === "android") return "android"
  if (/iPhone|iPad|iPod/i.test(agent) || hintPlatform === "ios") return "ios"
  if (/Windows/i.test(agent) || hintPlatform === "windows") return "windows"
  if (/Macintosh|Mac OS X/i.test(agent) || hintPlatform === "macos") {
    return "mac"
  }
  if (/Linux|X11/i.test(agent) || hintPlatform === "linux") {
    return hints?.mobile ? "android" : "linux"
  }
  return "other"
}

/** Read the three request headers into UA + hints. Works on any `Headers`. */
export function platformFromHeaders(headers: {
  get(name: string): string | null
}): Platform {
  return platformFromUserAgent(headers.get("user-agent"), {
    platform: headers.get("sec-ch-ua-platform"),
    mobile: headers.get("sec-ch-ua-mobile") === "?1",
  })
}

/** Normalise an OS string as LiveKit clients report it. */
export function platformFromOsString(os: string | null | undefined): Platform {
  const o = (os ?? "").toLowerCase().trim()
  if (!o) return "other"
  if (o.includes("android")) return "android"
  if (o === "ios" || o.includes("iphone") || o.includes("ipad")) return "ios"
  if (o.includes("chrome os") || o.includes("chromeos") || o.includes("cros")) {
    return "chromeos"
  }
  if (o.includes("windows")) return "windows"
  if (o.includes("mac")) return "mac"
  if (o.includes("linux")) return "linux"
  return "other"
}

// livekit ClientInfo.SDK values (@livekit/protocol): UNKNOWN 0, JS 1, SWIFT 2,
// ANDROID 3, FLUTTER 4, GO 5, UNITY 6, REACT_NATIVE 7, RUST 8, PYTHON 9, CPP 10,
// UNITY_WEB 11, NODE 12, UNREAL 13, ESP32 14.
const SDK_NAMES: Record<number, string> = {
  1: "JS",
  2: "SWIFT",
  3: "ANDROID",
  4: "FLUTTER",
  6: "UNITY",
  7: "REACT_NATIVE",
  11: "UNITY_WEB",
}
const NATIVE_SDKS = new Set(["SWIFT", "ANDROID", "FLUTTER", "UNITY", "REACT_NATIVE"])
const WEB_SDKS = new Set(["JS", "UNITY_WEB"])

/**
 * `{client, platform}` from LiveKit's `ClientInfo` (`sdk` is the enum value or
 * its name; `os` the string the client reported). `null` when the SDK is
 * neither a browser nor a mobile one (a server bot, an unknown client).
 */
export function clientFromLiveKit(clientInfo: {
  sdk?: string | number | null
  os?: string | null
}): { client: ClientKind; platform: Platform } | null {
  const raw = clientInfo.sdk
  const name =
    typeof raw === "number"
      ? (SDK_NAMES[raw] ?? "")
      : String(raw ?? "").toUpperCase()
  const osPlatform = platformFromOsString(clientInfo.os)

  if (NATIVE_SDKS.has(name)) {
    const fallback: Platform =
      name === "ANDROID" ? "android" : name === "SWIFT" ? "ios" : "other"
    return {
      client: "app",
      platform: osPlatform === "other" ? fallback : osPlatform,
    }
  }
  if (WEB_SDKS.has(name)) return { client: "web", platform: osPlatform }
  return null
}

/** `X-App-Version` → the integer build number, or null when absent/garbled. */
export function parseAppVersion(
  header: string | null | undefined
): number | null {
  if (header == null) return null
  const m = /^\s*(\d{1,9})\b/.exec(String(header))
  if (!m) return null
  const n = Number(m[1])
  return Number.isSafeInteger(n) ? n : null
}
