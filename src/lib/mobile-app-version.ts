// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Refusing old Android builds. The app sends `X-App-Version: <versionCode>`
 * on every call (core/network AppVersionInterceptor). When
 * `MOBILE_MIN_APP_VERSION` is set above it, `/api/mobile/*` answers 426.
 * Pure and import-free: it runs in the edge proxy.
 */

/** Routes an old build must still reach: sign-in/refresh/logout and updates. */
const EXEMPT = [
  /^\/api\/mobile\/auth(\/|$)/,
  /^\/api\/mobile\/(update|updates|version)(\/|$)/,
]

export const UPDATE_REQUIRED_MESSAGE = {
  ar: "هذا الإصدار من التطبيق قديم. حدّث التطبيق للمتابعة.",
  en: "This version of the app is out of date. Update the app to continue.",
}

/** Parses the configured floor; anything but a positive integer means off. */
export function parseMinVersion(raw: string | undefined | null): number {
  const n = Number((raw ?? "").trim())
  return Number.isInteger(n) && n > 0 ? n : 0
}

/** True when this request must be refused. No / garbage header: never. */
export function isAppVersionRefused(opts: {
  pathname: string
  header: string | null | undefined
  min: number
}): boolean {
  if (opts.min <= 0) return false
  if (!opts.pathname.startsWith("/api/mobile/")) return false
  if (EXEMPT.some((r) => r.test(opts.pathname))) return false
  const h = (opts.header ?? "").trim()
  if (!/^\d+$/.test(h)) return false
  return Number(h) < opts.min
}

/** The 426 body the app and any client can read. */
export function updateRequiredBody(minVersion: number, lang?: string | null) {
  return {
    error: "update_required",
    minVersion,
    message:
      lang?.toLowerCase().startsWith("en")
        ? UPDATE_REQUIRED_MESSAGE.en
        : `${UPDATE_REQUIRED_MESSAGE.ar} / ${UPDATE_REQUIRED_MESSAGE.en}`,
  }
}
