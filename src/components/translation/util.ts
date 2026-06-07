// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure utility functions for the translation system.
 * No imports from other translation files - these are standalone helpers.
 */

import type { Locale } from "@/components/internationalization/config"

import type { Lang } from "./types"

/**
 * Prepare content data for database storage.
 * Simply adds the `lang` field to indicate content language.
 *
 * @example
 * const data = withLang(
 *   { title: "مرحبا", body: "محتوى الإعلان", priority: "HIGH" },
 *   "ar"
 * );
 * // { title: "مرحبا", body: "محتوى الإعلان", priority: "HIGH", lang: "ar" }
 */
export function withLang<T extends Record<string, unknown>>(
  data: T,
  lang: Lang
): T & { lang: Lang } {
  return { ...data, lang }
}

/**
 * Get the content language from an entity.
 *
 * @example
 * const lang = getContentLang(announcement); // "ar"
 */
export function getContentLang<T extends Record<string, unknown>>(
  entity: T
): "ar" | "en" {
  const lang = entity.lang
  return lang === "en" ? "en" : "ar"
}

/**
 * Check if content needs translation for the given display locale.
 *
 * @example
 * if (needsTranslation(announcement, "en")) {
 *   // Fetch translation from cache or API
 * }
 */
export function needsTranslation<T extends Record<string, unknown>>(
  entity: T,
  displayLocale: Locale
): boolean {
  return getContentLang(entity) !== displayLocale
}

/**
 * Detect the primary language of text content
 */
export function detectLang(text: string): "ar" | "en" {
  const arabicPattern = /[\u0600-\u06FF]/g
  const matches = text.match(arabicPattern)
  const arabicRatio = (matches?.length ?? 0) / text.length
  return arabicRatio > 0.3 ? "ar" : "en"
}

/**
 * Detect the content language of a short value (name, room code, label) from its
 * ACTUAL script \u2014 not a stored `lang` flag.
 *
 * This is the single source of truth for "what language is this stored text in",
 * replacing the ad-hoc `const hasLatin = (s) => /[a-zA-Z]/.tests(s)` that was copied
 * inline across students/teachers/staff/parents. It is robust to:
 *  - a wrong `lang` flag (admission writes Latin names with the default `lang="ar"`)
 *  - an ABSENT `lang` flag (StaffMember has no `lang` column at all)
 *
 * Rule: any Arabic script -> "ar"; otherwise any Latin letter -> "en"; else "ar".
 * Arabic wins on mixed strings so the Arabic portion still gets translated on `/en`.
 *
 * @example
 * detectScript("\u0645\u062D\u0645\u062F \u0639\u0644\u064A") // "ar"
 * detectScript("Mohammed Ali") // "en"
 * detectScript("B102") // "en"
 */
export function detectScript(text: string | null | undefined): "ar" | "en" {
  if (!text) return "ar"
  if (/[\u0600-\u06FF]/.test(text)) return "ar"
  if (/[a-zA-Z]/.test(text)) return "en"
  return "ar"
}

/**
 * Compose a person's full name from its parts in storage order.
 * Single source of truth for `${firstName} ${lastName}` composition \u2014 replaces the
 * ~173 inline concatenations across the dashboard.
 *
 * @example
 * fullName({ firstName: "\u0645\u062D\u0645\u062F", lastName: "\u0639\u0644\u064A" }) // "\u0645\u062D\u0645\u062F \u0639\u0644\u064A"
 * fullName({ firstName: "Ali", middleName: "B", lastName: "Khan" }) // "Ali B Khan"
 */
export function fullName(person: {
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
}): string {
  return [person.firstName, person.middleName, person.lastName]
    .filter(Boolean)
    .join(" ")
    .trim()
}
