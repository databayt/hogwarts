import type { Locale } from "@/components/internationalization/config"

// ============================================================================
// Bilingual Content Types
// ============================================================================

/**
 * Represents content that can be stored in two languages.
 * Use for user-generated content like announcements, notifications, etc.
 */
export type BilingualText = {
  en: string
  ar: string
}

/**
 * Partial bilingual text - at least one language is required
 */
export type PartialBilingualText = {
  en?: string
  ar?: string
}

/**
 * Creates a bilingual text object from separate fields
 */
export function createBilingualText(en: string, ar: string): BilingualText {
  return { en, ar }
}

// ============================================================================
// Localized Content Getters
// ============================================================================

/**
 * Get localized text based on current locale.
 * Falls back to the other language if the preferred one is empty.
 *
 * @example
 * // For dual-field database models
 * const title = getLocalizedText(locale, announcement.titleEn, announcement.titleAr);
 *
 * @example
 * // For BilingualText objects
 * const content = getLocalizedText(locale, item.title.en, item.title.ar);
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
 * Get localized text from a BilingualText object
 *
 * @example
 * const text = getLocalizedFromObject(locale, { en: "Hello", ar: "مرحبا" });
 */
export function getLocalizedFromObject(
  locale: Locale,
  text: BilingualText | PartialBilingualText | null | undefined
): string {
  if (!text) return ""
  return getLocalizedText(locale, text.en, text.ar)
}

/**
 * Get localized text from a JSON field stored in the database
 * Handles both string (legacy) and object (bilingual) formats
 *
 * @example
 * // Database stores: { "en": "Hello", "ar": "مرحبا" } or "Hello"
 * const text = getLocalizedFromJSON(locale, dbField);
 */
export function getLocalizedFromJSON(
  locale: Locale,
  jsonField: string | BilingualText | null | undefined
): string {
  if (!jsonField) return ""

  // If it's already a string (legacy format), return as-is
  if (typeof jsonField === "string") {
    return jsonField
  }

  // If it's a bilingual object
  return getLocalizedFromObject(locale, jsonField)
}

// ============================================================================
// Content Helpers for Forms
// ============================================================================

/**
 * Type for form data that includes bilingual fields
 */
export type BilingualFormData<T extends string> = {
  [K in `${T}En` | `${T}Ar`]: string
}

/**
 * Extract bilingual form data to a BilingualText object
 *
 * @example
 * const form = { titleEn: "Hello", titleAr: "مرحبا" };
 * const title = extractBilingual(form, "title"); // { en: "Hello", ar: "مرحبا" }
 */
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

/**
 * Spread bilingual text into form fields
 *
 * @example
 * const title = { en: "Hello", ar: "مرحبا" };
 * const formDefaults = spreadBilingual(title, "title");
 * // { titleEn: "Hello", titleAr: "مرحبا" }
 */
export function spreadBilingual(
  text: BilingualText | PartialBilingualText | null | undefined,
  fieldName: string
): Record<string, string> {
  return {
    [`${fieldName}En`]: text?.en ?? "",
    [`${fieldName}Ar`]: text?.ar ?? "",
  }
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if bilingual content has at least one language filled
 */
export function hasBilingualContent(
  text: PartialBilingualText | null | undefined
): boolean {
  if (!text) return false
  return Boolean(text.en?.trim() || text.ar?.trim())
}

/**
 * Check if bilingual content has both languages filled
 */
export function isFullyBilingual(
  text: PartialBilingualText | null | undefined
): boolean {
  if (!text) return false
  return Boolean(text.en?.trim() && text.ar?.trim())
}

/**
 * Get completion status for bilingual content
 */
export function getBilingualStatus(
  text: PartialBilingualText | null | undefined
): {
  complete: boolean
  missingEn: boolean
  missingAr: boolean
} {
  const hasEn = Boolean(text?.en?.trim())
  const hasAr = Boolean(text?.ar?.trim())
  return {
    complete: hasEn && hasAr,
    missingEn: !hasEn,
    missingAr: !hasAr,
  }
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Get a display preview for bilingual content showing both languages
 * Useful for admin interfaces
 *
 * @example
 * getBilingualPreview({ en: "Hello", ar: "مرحبا" }, 50);
 * // "Hello | مرحبا"
 */
export function getBilingualPreview(
  text: BilingualText | PartialBilingualText | null | undefined,
  maxLength = 100
): string {
  if (!text) return ""

  const en = text.en?.trim() ?? ""
  const ar = text.ar?.trim() ?? ""

  if (en && ar) {
    const truncatedEn =
      en.length > maxLength / 2 ? en.slice(0, maxLength / 2 - 1) + "…" : en
    const truncatedAr =
      ar.length > maxLength / 2 ? ar.slice(0, maxLength / 2 - 1) + "…" : ar
    return `${truncatedEn} | ${truncatedAr}`
  }

  const content = en || ar
  return content.length > maxLength
    ? content.slice(0, maxLength - 1) + "…"
    : content
}

// ============================================================================
// Database Migration Helpers
// ============================================================================

/**
 * Convert legacy single-field content to bilingual format
 * Detects language and assigns appropriately
 *
 * @example
 * // During data migration
 * const bilingual = convertToBilingual("مرحبا بالعالم");
 * // { en: "", ar: "مرحبا بالعالم" }
 */
export function convertToBilingual(
  legacyContent: string | null | undefined,
  defaultLocale: Locale = "ar"
): BilingualText {
  if (!legacyContent) return { en: "", ar: "" }

  // Detect if content is primarily Arabic
  const arabicPattern = /[\u0600-\u06FF]/
  const isArabic = arabicPattern.test(legacyContent)

  if (isArabic) {
    return { en: "", ar: legacyContent }
  }

  // If not Arabic, assign based on defaultLocale
  if (defaultLocale === "ar") {
    return { en: "", ar: legacyContent }
  }

  return { en: legacyContent, ar: "" }
}

/**
 * Detect the primary language of text content
 */
export function detectLanguage(text: string): Locale {
  const arabicPattern = /[\u0600-\u06FF]/g
  const matches = text.match(arabicPattern)
  const arabicRatio = (matches?.length ?? 0) / text.length

  // If more than 30% Arabic characters, consider it Arabic
  return arabicRatio > 0.3 ? "ar" : "en"
}
