"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { translate } from "./actions"
import type { Lang } from "./types"

/**
 * Get display text with on-demand translation.
 * If content lang matches display lang, returns text directly.
 * Otherwise, translates via Google Translate with database caching.
 *
 * @param text - The stored text content
 * @param contentLang - The language the content was stored in
 * @param displayLang - The language to display to the user
 * @param schoolId - School ID for cache scoping
 * @returns The text in the display language
 *
 * @example
 * // Content stored in Arabic, user viewing in English
 * const title = await getText("مرحبا", "ar", "en", schoolId);
 * // Returns "Hello" (translated and cached)
 *
 * // Content stored in Arabic, user viewing in Arabic
 * const title = await getText("مرحبا", "ar", "ar", schoolId);
 * // Returns "مرحبا" (no translation needed)
 */
export async function getText(
  text: string | null | undefined,
  contentLang: Lang,
  displayLang: Lang,
  schoolId: string
): Promise<string> {
  if (!text || text.trim() === "") return ""

  // Same language — but detect script mismatch (e.g. Latin text stored as "ar")
  if (contentLang === displayLang) {
    if (contentLang === "ar") {
      const stripped = text.replace(/[\d\s\-_.,!?:;()\[\]{}'"\/\\]/g, "")
      if (stripped && /^[a-zA-Z]+$/.test(stripped)) {
        // Text is Latin but claimed as Arabic — translate from English
        try {
          return await translate(text, "en", displayLang, schoolId)
        } catch {
          return text
        }
      }
    }
    return text
  }

  // Script mismatch: text is already in the display script — skip translation.
  // Prevents garbage output when contentLang flag disagrees with actual stored script.
  const hasArabicScript = /[؀-ۿ]/.test(text)
  if (displayLang === "ar" && hasArabicScript) return text
  if (displayLang === "en" && !hasArabicScript && /[a-zA-Z]/.test(text)) {
    return text
  }

  try {
    return await translate(text, contentLang, displayLang, schoolId)
  } catch (error) {
    console.error("[getText] Translation failed, returning source:", error)
    return text // Fallback to source text
  }
}

/**
 * Batch translate multiple fields of an entity for display.
 * More efficient than calling getText for each field.
 *
 * @param entity - The database entity with content fields
 * @param fields - Array of field names to translate
 * @param contentLang - The language the content was stored in
 * @param displayLang - The language to display to the user
 * @param schoolId - School ID for cache scoping
 * @returns Object with translated field values
 *
 * @example
 * const translated = await getFields(
 *   announcement,
 *   ["title", "body"],
 *   announcement.lang,
 *   "en",
 *   schoolId
 * );
 * // { title: "Hello", body: "Welcome to school" }
 */
export async function getFields<T extends Record<string, unknown>>(
  entity: T,
  fields: string[],
  contentLang: Lang,
  displayLang: Lang,
  schoolId: string
): Promise<Record<string, string>> {
  // Same language - return fields directly
  if (contentLang === displayLang) {
    const result: Record<string, string> = {}
    for (const field of fields) {
      const value = entity[field]
      result[field] = typeof value === "string" ? value : ""
    }
    return result
  }

  // Translate all fields in parallel
  const translations = await Promise.all(
    fields.map(async (field) => {
      const value = entity[field]
      const text = typeof value === "string" ? value : ""
      if (!text) return [field, ""] as const
      // Script mismatch guard — content flag disagrees with actual script
      const hasArabicScript = /[؀-ۿ]/.test(text)
      if (displayLang === "ar" && hasArabicScript) return [field, text] as const
      if (displayLang === "en" && !hasArabicScript && /[a-zA-Z]/.test(text)) {
        return [field, text] as const
      }
      try {
        const translated = await translate(
          text,
          contentLang,
          displayLang,
          schoolId
        )
        return [field, translated] as const
      } catch {
        return [field, text] as const // Fallback to source
      }
    })
  )

  return Object.fromEntries(translations)
}
