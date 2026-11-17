// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Steering Android phones from the web live room to the school's app.
 * Pure helpers only (no DOM) so they unit-test cleanly.
 */

export const ANDROID_PACKAGE = "org.hogwarts.android"

/** The generic alias — always the latest signed build. */
export const ANDROID_APP_URL =
  "https://cdn.databayt.org/balqalam/app/balqalam.apk"

/** School-specific builds, keyed by subdomain. */
const SCHOOL_APK: Record<string, string> = {
  alabidae: "https://cdn.databayt.org/balqalam/app/alabidae/alabidae.apk",
}

/** How a school's own app introduces itself on the web install sheet. */
const SCHOOL_APP: Record<
  string,
  { name: string; nameEn: string; icon: string }
> = {
  alabidae: {
    name: "الإبداع",
    nameEn: "Al-Ibda",
    icon: "https://cdn.databayt.org/balqalam/app/alabidae/icon.png",
  },
}

export function schoolAndroidApp(
  subdomain: string | null | undefined,
  lang: string
): { url: string; name: string; icon: string } | null {
  const key = subdomain?.toLowerCase()
  const app = key ? SCHOOL_APP[key] : undefined
  const url = schoolApkUrl(subdomain)
  if (!app || !url) return null
  return { url, name: lang === "en" ? app.nameEn : app.name, icon: app.icon }
}

/** The school's own APK, or null when the school has no app of its own. */
export function schoolApkUrl(
  subdomain: string | null | undefined
): string | null {
  return (subdomain && SCHOOL_APK[subdomain.toLowerCase()]) || null
}

export function apkUrlFor(subdomain: string | null | undefined): string {
  return (subdomain && SCHOOL_APK[subdomain.toLowerCase()]) || ANDROID_APP_URL
}

/** `alabidae.balqalam.com` -> `alabidae`; bare/localhost hosts -> null. */
export function subdomainOf(host: string): string | null {
  const name = host.split(":")[0].toLowerCase()
  const parts = name.split(".")
  if (parts.length < 3) return null
  return parts[0]
}

export type UaKind = "android" | "android-webview" | "other"

/** In-app browsers: Android WebView, WhatsApp, Facebook, Instagram. */
const WEBVIEW = /; wv\)|WhatsApp|FBAN|FBAV|Instagram/i

export function classifyUserAgent(ua: string | null | undefined): UaKind {
  if (!ua || !/Android/i.test(ua)) return "other"
  return WEBVIEW.test(ua) ? "android-webview" : "android"
}

/** The WebView check also applies off-Android (WhatsApp on iOS). */
export function isInAppBrowser(ua: string | null | undefined): boolean {
  return !!ua && WEBVIEW.test(ua)
}

/** Chrome intent URL that opens the class in the app, or the APK if absent. */
export function buildIntentUrl(
  host: string,
  pathAndQuery: string,
  apkUrl: string
): string {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`
  return (
    `intent://${host}${path}#Intent;scheme=https;package=${ANDROID_PACKAGE};` +
    `S.browser_fallback_url=${encodeURIComponent(apkUrl)};end`
  )
}
