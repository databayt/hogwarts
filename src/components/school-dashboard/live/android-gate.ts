// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The Android browser gate: on a phone's browser, a school with its own app
 * shows only "open / download the app". Pure decisions, no DOM, so they
 * unit-test cleanly. The component is `android-app-gate.tsx`.
 */
import { schoolNow } from "@/components/school-dashboard/timetable/school-now"

import { buildIntentUrl } from "./android-app"

/** Set (365 d) when the app opens a web page with `?app=1` / `?from=app`. */
export const APP_COOKIE = "bq_app"
/** `bq_web_ok=<school-local YYYY-MM-DD>` — a browser let through for that day. */
export const WEB_OK_COOKIE = "bq_web_ok"

/** Android phones and tablets. iOS, desktop and ChromeOS never match. */
export function isAndroidUa(ua: string | null | undefined): boolean {
  return !!ua && /Android/i.test(ua)
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

export function shouldGate(opts: {
  ua: string | null | undefined
  isAppSchool: boolean
  cookies: Record<string, string>
  todayInSchoolZone: string
}): boolean {
  if (!opts.isAppSchool || !isAndroidUa(opts.ua)) return false
  if (opts.cookies[APP_COOKIE] === "1") return false
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
