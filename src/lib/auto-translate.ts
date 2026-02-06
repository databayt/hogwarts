/**
 * Auto-Translation Utilities - Single-Language Storage Pattern
 *
 * Content is stored in ONE language + `lang` field.
 * Translation happens on-demand when the display locale differs from content lang.
 */

import { translateFields } from "./translate"

type SupportedLanguage = "en" | "ar"

interface TranslationResult<T> {
  success: boolean
  data: T & { lang: SupportedLanguage }
  error?: string
}

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
 * Auto-translate fields for the user (optional UX enhancement).
 * Translates specified fields and returns the translated versions
 * alongside the original. Used when admin wants to preview translation.
 *
 * @example
 * const result = await withAutoTranslation(
 *   { title: "Hello", body: "World" },
 *   ["title", "body"],
 *   "en"
 * );
 * // result.data = { title: "Hello", body: "World", lang: "en" }
 * // result.translatedFields = { title: "مرحبا", body: "العالم" }
 */
export async function withAutoTranslation<T extends Record<string, unknown>>(
  data: T,
  translatableFields: (keyof T)[],
  sourceLanguage: SupportedLanguage
): Promise<
  TranslationResult<T> & { translatedFields?: Record<string, string> }
> {
  // Extract only the fields that need translation
  const fieldsToTranslate: Record<string, string> = {}
  for (const field of translatableFields) {
    const value = data[field]
    if (typeof value === "string" && value.trim() !== "") {
      fieldsToTranslate[String(field)] = value
    }
  }

  const resultData = { ...data, lang: sourceLanguage }

  if (Object.keys(fieldsToTranslate).length === 0) {
    return { success: true, data: resultData }
  }

  try {
    const result = await translateFields({
      fields: fieldsToTranslate,
      sourceLanguage,
    })

    if (result.success && result.translated) {
      return {
        success: true,
        data: resultData,
        translatedFields: result.translated,
      }
    }

    return {
      success: false,
      data: resultData,
      error: result.error || "Translation failed",
    }
  } catch (error) {
    console.error("[withAutoTranslation] Error:", error)
    return {
      success: false,
      data: resultData,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}

/**
 * Get the display text from an entity.
 * Returns the stored value directly.
 *
 * For on-demand translation when display locale differs from content lang,
 * use getDisplayText() from content-display.ts instead.
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
