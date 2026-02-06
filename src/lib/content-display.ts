"use server"

import { translateWithCache } from "@/lib/translate"

type SupportedLanguage = "en" | "ar"

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
 * const title = await getDisplayText("مرحبا", "ar", "en", schoolId);
 * // Returns "Hello" (translated and cached)
 *
 * // Content stored in Arabic, user viewing in Arabic
 * const title = await getDisplayText("مرحبا", "ar", "ar", schoolId);
 * // Returns "مرحبا" (no translation needed)
 */
export async function getDisplayText(
  text: string | null | undefined,
  contentLang: SupportedLanguage,
  displayLang: SupportedLanguage,
  schoolId: string
): Promise<string> {
  if (!text || text.trim() === "") return ""

  // Same language - return directly
  if (contentLang === displayLang) return text

  try {
    return await translateWithCache(text, contentLang, displayLang, schoolId)
  } catch (error) {
    console.error(
      "[getDisplayText] Translation failed, returning source:",
      error
    )
    return text // Fallback to source text
  }
}

/**
 * Batch translate multiple fields of an entity for display.
 * More efficient than calling getDisplayText for each field.
 *
 * @param entity - The database entity with content fields
 * @param fields - Array of field names to translate
 * @param contentLang - The language the content was stored in
 * @param displayLang - The language to display to the user
 * @param schoolId - School ID for cache scoping
 * @returns Object with translated field values
 *
 * @example
 * const translated = await getDisplayFields(
 *   announcement,
 *   ["title", "body"],
 *   announcement.lang,
 *   "en",
 *   schoolId
 * );
 * // { title: "Hello", body: "Welcome to school" }
 */
export async function getDisplayFields<T extends Record<string, unknown>>(
  entity: T,
  fields: string[],
  contentLang: SupportedLanguage,
  displayLang: SupportedLanguage,
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
      try {
        const translated = await translateWithCache(
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
