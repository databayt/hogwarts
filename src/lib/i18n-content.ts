import type { Locale } from "@/components/internationalization/config"

// ============================================================================
// Content Language Types
// ============================================================================

/**
 * Represents content stored in a single language with a lang identifier.
 * This is the new pattern - content is stored once, translated on-demand.
 */
export type ContentWithLang = {
  text: string
  lang: "ar" | "en"
}

// ============================================================================
// Content Getters
// ============================================================================

/**
 * Get content text from an entity that uses the single-language storage pattern.
 * Returns the stored value directly. For translation, use getDisplayText from content-display.ts.
 *
 * @example
 * const title = getContentText(announcement, "title");
 */
export function getContentText<T extends Record<string, unknown>>(
  entity: T,
  fieldName: string
): string {
  const value = entity[fieldName]
  return typeof value === "string" ? value : ""
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

// ============================================================================
// Legacy Compatibility (deprecated)
// ============================================================================

/**
 * @deprecated Use getContentText() instead. Kept for migration period.
 */
export type BilingualText = {
  en: string
  ar: string
}

/**
 * @deprecated Use getContentText() instead. Kept for migration period.
 */
export type PartialBilingualText = {
  en?: string
  ar?: string
}

/**
 * @deprecated Content is now stored in a single language.
 */
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

/**
 * @deprecated Content is now stored in a single language.
 */
export function getLocalizedFromObject(
  locale: Locale,
  text: BilingualText | PartialBilingualText | null | undefined
): string {
  if (!text) return ""
  return getLocalizedText(locale, text.en, text.ar)
}

/**
 * @deprecated Content is now stored in a single language.
 */
export function getLocalizedFromJSON(
  locale: Locale,
  jsonField: string | BilingualText | null | undefined
): string {
  if (!jsonField) return ""
  if (typeof jsonField === "string") return jsonField
  return getLocalizedFromObject(locale, jsonField)
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if content text has a non-empty value
 */
export function hasContent(text: string | null | undefined): boolean {
  return Boolean(text?.trim())
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Truncate text for display preview
 */
export function getContentPreview(
  text: string | null | undefined,
  maxLength = 100
): string {
  if (!text) return ""
  return text.length > maxLength
    ? text.slice(0, maxLength - 1) + "\u2026"
    : text
}

/**
 * Detect the primary language of text content
 */
export function detectLanguage(text: string): "ar" | "en" {
  const arabicPattern = /[\u0600-\u06FF]/g
  const matches = text.match(arabicPattern)
  const arabicRatio = (matches?.length ?? 0) / text.length
  return arabicRatio > 0.3 ? "ar" : "en"
}

// ============================================================================
// Legacy helpers (deprecated, kept for backward compat)
// ============================================================================

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
