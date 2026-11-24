// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The Android browser gate: on a phone's browser, a school with its own app
 * shows only "open / download the app". Pure decisions, no DOM, so they
 * unit-test cleanly. The component is `android-app-gate.tsx`.
 */
import { schoolNow } from "@/components/school-dashboard/timetable/school-now"

import { buildIntentUrl } from "./android-app"

/**
 * `sessionStorage` key set when the app opens a web page with `?app=1` /
 * `?from=app`. Per tab on purpose: a Custom Tab shares Chrome's cookie jar, so
 * a cookie let plain Chrome through forever after one app-opened page. A
 * sessionStorage entry dies with its tab, and a Custom Tab is its own tab.
 */
export const APP_STORAGE_KEY = "bq_app"
/** `bq_web_ok=<school-local YYYY-MM-DD>` — a browser let through for that day. */
export const WEB_OK_COOKIE = "bq_web_ok"

/** Android phones and tablets. iOS, desktop and ChromeOS never match. */
export function isAndroidUa(ua: string | null | undefined): boolean {
  return !!ua && /Android/i.test(ua)
}

export type DeviceProbe = {
  ua: string | null | undefined
  /** `navigator.userAgentData?.platform` (Chromium client hints). */
  uaPlatform?: string | null
  /** `navigator.maxTouchPoints`. */
  maxTouchPoints?: number | null
  /** `Math.min(screen.width, screen.height)`. */
  screenMin?: number | null
}

/**
 * Android, including Chrome's "desktop site" mode, which drops "Android" from
 * the user agent: that reads as plain Linux, so a touch screen no wider than a
 * tablet stands in. A real Linux desktop has no touch; ChromeOS is excluded;
 * iPads are not Linux.
 */
export function isAndroidDevice(d: DeviceProbe): boolean {
  if (isAndroidUa(d.ua)) return true
  if (d.uaPlatform === "Android") return true
  const ua = d.ua ?? ""
  return (
    /Linux/i.test(ua) &&
    !/CrOS/i.test(ua) &&
    (d.maxTouchPoints ?? 0) > 0 &&
    (d.screenMin ?? Infinity) <= 900
  )
}

/** True when the URL carries the app's own mark. */
export function hasAppFlag(search: string): boolean {
  const p = new URLSearchParams(search)
  return p.get("app") === "1" || p.get("from") === "app"
}

/** `document.cookie` -> a name/value map. */
export function parseCookies(header: string | null | undefined) {
  const out: Record<string, string> = {}
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=")
    if (i < 0) continue
    const k = part.slice(0, i).trim()
    if (k) out[k] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

/** The school's calendar day, `YYYY-MM-DD`, in its own time zone. */
export function schoolDateString(
  timeZone?: string | null,
  at: Date | number = Date.now()
): string {
  const n = schoolNow(timeZone, at)
  const p = (v: number, w = 2) => String(v).padStart(w, "0")
  return `${p(n.year, 4)}-${p(n.month)}-${p(n.day)}`
}

export function shouldGate(
  opts: DeviceProbe & {
    isAppSchool: boolean
    /** The tab carries the app's mark (`sessionStorage[APP_STORAGE_KEY] === "1"`). */
    appMark?: boolean
    cookies: Record<string, string>
    todayInSchoolZone: string
  }
): boolean {
  if (!opts.isAppSchool || !isAndroidDevice(opts)) return false
  if (opts.appMark) return false
  if (opts.cookies[WEB_OK_COOKIE] === opts.todayInSchoolZone) return false
  return true
}

/** Opens the CURRENT path in the app, the APK if the app is not installed. */
export function buildGateIntentUrl(
  host: string,
  pathname: string,
  search: string,
  apkUrl: string
): string {
  return buildIntentUrl(host, `${pathname}${search}`, apkUrl)
}
