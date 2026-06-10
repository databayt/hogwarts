// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure locale-detection helpers — the SINGLE implementation behind the live
 * edge middleware (`src/proxy.ts`). Extracted so the precedence rules
 * (cookie → Accept-Language → default) are unit-testable without
 * NextRequest, and so no second "reference" implementation can drift from
 * what actually runs. (A dead negotiator-based middleware.ts used to live
 * here; it was never wired and was deleted in favor of this.)
 */
import { i18n, type Locale } from "./config"

/**
 * Resolve the viewer locale.
 * Precedence: valid NEXT_LOCALE cookie → first Accept-Language tag → default.
 * The Accept-Language parse is deliberately lightweight (edge runtime):
 * only the FIRST tag is considered, reduced to its base language.
 */
export function detectLocale(input: {
  cookieLocale?: string | null
  acceptLanguage?: string | null
}): Locale {
  const { cookieLocale, acceptLanguage } = input

  if (cookieLocale && i18n.locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale
  }

  if (acceptLanguage) {
    const lang = acceptLanguage
      .split(",")[0]
      .split(";")[0]
      .split("-")[0]
      .trim()
      .toLowerCase()
    if (i18n.locales.includes(lang as Locale)) {
      return lang as Locale
    }
  }

  return i18n.defaultLocale
}

/** Whether the pathname already carries a locale segment (/en/..., /ar). */
export function pathnameHasLocale(pathname: string): boolean {
  return i18n.locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
}
