// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pure utility functions for the translation system.
 * No imports from other translation files - these are standalone helpers.
 */

import type { Locale } from "@/components/internationalization/config"

import type { SupportedLanguage } from "./types"

/**
 * Prepare content data for database storage.
 * Simply adds the `lang` field to indicate content language.
 *
 * @example
 * const data = prepareContentData(
 *   { title: "مرحبا", body: "محتوى الإعلان", priority: "HIGH" },
 *   "ar"
 * );
 * // { title: "مرحبا", body: "محتوى الإعلان", priority: "HIGH", lang: "ar" }
 */
export function prepareContentData<T extends Record<string, unknown>>(
  data: T,
  lang: SupportedLanguage
): T & { lang: SupportedLanguage } {
  return { ...data, lang }
}

/**
 * Get the display text from an entity.
 * Returns the stored value directly.
 *
 * For on-demand translation when display locale differs from content lang,
 * use getDisplayText() from display.ts instead.
 *
 * @example
 * const title = getContentField(announcement, "title");
 * // Returns announcement.title directly
 */
export function getContentField<T extends Record<string, unknown>>(
  entity: T,
  fieldName: string
): string {
  const value = entity[fieldName]
  return typeof value === "string" ? value : ""
}

/**
 * Get content text from an entity that uses the single-language storage pattern.
 * Returns the stored value directly. For translation, use getDisplayText from display.ts.
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

/**
 * Detect the primary language of text content
 */
export function detectLanguage(text: string): "ar" | "en" {
  const arabicPattern = /[\u0600-\u06FF]/g
  const matches = text.match(arabicPattern)
  const arabicRatio = (matches?.length ?? 0) / text.length
  return arabicRatio > 0.3 ? "ar" : "en"
}

/**
 * Check if content text has a non-empty value
 */
export function hasContent(text: string | null | undefined): boolean {
  return Boolean(text?.trim())
}

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
