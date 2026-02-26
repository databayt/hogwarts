// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Legacy bilingual helpers (deprecated)
 * Kept for backward compatibility during migration period.
 * All functions in this file are @deprecated.
 */

import type { Locale } from "@/components/internationalization/config"

/** @deprecated Use getContentText() instead. Kept for migration period. */
export type BilingualText = {
  en: string
  ar: string
}

/** @deprecated Use getContentText() instead. Kept for migration period. */
export type PartialBilingualText = {
  en?: string
  ar?: string
}

/** @deprecated Content is now stored in a single language. */
export function getLocalizedText(
  locale: Locale,
  en: string | null | undefined,
  ar: string | null | undefined
): string {
  if (locale === "ar") {
    return ar || en || ""
  }
  return en || ar || ""
}

/** @deprecated Content is now stored in a single language. */
export function getLocalizedFromObject(
  locale: Locale,
  text: BilingualText | PartialBilingualText | null | undefined
): string {
  if (!text) return ""
  return getLocalizedText(locale, text.en, text.ar)
}

/** @deprecated Content is now stored in a single language. */
export function getLocalizedFromJSON(
  locale: Locale,
  jsonField: string | BilingualText | null | undefined
): string {
  if (!jsonField) return ""
  if (typeof jsonField === "string") return jsonField
  return getLocalizedFromObject(locale, jsonField)
}

/** @deprecated */
export function createBilingualText(en: string, ar: string): BilingualText {
  return { en, ar }
}

/** @deprecated */
export type BilingualFormData<T extends string> = {
  [K in `${T}En` | `${T}Ar`]: string
}

/** @deprecated */
export function extractBilingual<T extends Record<string, unknown>>(
  data: T,
  fieldName: string
): BilingualText {
  const enKey = `${fieldName}En` as keyof T
  const arKey = `${fieldName}Ar` as keyof T
  return {
    en: String(data[enKey] ?? ""),
    ar: String(data[arKey] ?? ""),
  }
}

/** @deprecated */
export function spreadBilingual(
  text: BilingualText | PartialBilingualText | null | undefined,
  fieldName: string
): Record<string, string> {
  return {
    [`${fieldName}En`]: text?.en ?? "",
    [`${fieldName}Ar`]: text?.ar ?? "",
  }
}

/** @deprecated */
export function hasBilingualContent(
  text: PartialBilingualText | null | undefined
): boolean {
  if (!text) return false
  return Boolean(text.en?.trim() || text.ar?.trim())
}

/** @deprecated */
export function isFullyBilingual(
  text: PartialBilingualText | null | undefined
): boolean {
  if (!text) return false
  return Boolean(text.en?.trim() && text.ar?.trim())
}

/** @deprecated */
export function getBilingualStatus(
  text: PartialBilingualText | null | undefined
): {
  complete: boolean
  missingEn: boolean
  missingAr: boolean
} {
  const hasEn = Boolean(text?.en?.trim())
  const hasAr = Boolean(text?.ar?.trim())
  return { complete: hasEn && hasAr, missingEn: !hasEn, missingAr: !hasAr }
}

/** @deprecated */
export function getBilingualPreview(
  text: BilingualText | PartialBilingualText | null | undefined,
  maxLength = 100
): string {
  if (!text) return ""
  const en = text.en?.trim() ?? ""
  const ar = text.ar?.trim() ?? ""
  if (en && ar) {
    const truncatedEn =
      en.length > maxLength / 2 ? en.slice(0, maxLength / 2 - 1) + "\u2026" : en
    const truncatedAr =
      ar.length > maxLength / 2 ? ar.slice(0, maxLength / 2 - 1) + "\u2026" : ar
    return `${truncatedEn} | ${truncatedAr}`
  }
  const content = en || ar
  return content.length > maxLength
    ? content.slice(0, maxLength - 1) + "\u2026"
    : content
}

/** @deprecated */
export function convertToBilingual(
  legacyContent: string | null | undefined,
  defaultLocale: Locale = "ar"
): BilingualText {
  if (!legacyContent) return { en: "", ar: "" }
  const arabicPattern = /[\u0600-\u06FF]/
  const isArabic = arabicPattern.test(legacyContent)
  if (isArabic) return { en: "", ar: legacyContent }
  if (defaultLocale === "ar") return { en: "", ar: legacyContent }
  return { en: legacyContent, ar: "" }
}
