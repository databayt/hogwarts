// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Finance notification copy — one place that turns a school's preferred
 * language into the `finance.notifications.*` strings a server-side dispatcher
 * needs, plus the `{placeholder}` interpolation those strings use.
 *
 * Crons and actions used to inline `isAr ? "…" : "…"` ternaries; that hides
 * copy from the dictionary parity check and can never grow past two locales.
 * Load only the finance namespace here (not the whole dictionary) — a cron
 * visits every school in one run and must not pay the full merge per school.
 */

import "server-only"

import type { Locale } from "@/components/internationalization/config"
import { loadFeature } from "@/components/internationalization/namespaces"

export type FinanceNotificationCopy = Record<string, string>

const copyByLang = new Map<Locale, Promise<FinanceNotificationCopy>>()

function toLocale(lang: string | null | undefined): Locale {
  return lang === "ar" ? "ar" : "en"
}

/**
 * Resolve the `finance.notifications` slice for a language. Memoized per
 * process, not per request — the JSON is static, and a cron run has no
 * React request scope for `cache()` to bind to.
 */
export function getFinanceNotificationCopy(
  lang: string | null | undefined
): Promise<FinanceNotificationCopy> {
  const locale = toLocale(lang)
  let pending = copyByLang.get(locale)
  if (!pending) {
    pending = loadFeature("finance", locale).then((finance) => {
      const notifications = (finance as { notifications?: unknown })
        ?.notifications
      return (
        notifications && typeof notifications === "object" ? notifications : {}
      ) as FinanceNotificationCopy
    })
    copyByLang.set(locale, pending)
  }
  return pending
}

/** Fill `{key}` placeholders. Mirrors the client `interpolate()` helper. */
export function interp(
  template: string,
  params: Record<string, string | number>
): string {
  return Object.entries(params).reduce(
    (out, [k, v]) => out.replaceAll(`{${k}}`, String(v)),
    template
  )
}
