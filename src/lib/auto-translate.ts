/**
 * Auto-Translation Wrapper - Bilingual Field Population
 *
 * PURPOSE: Automatically translates form fields and appends language-suffixed versions
 * Enables single-input forms that populate both Arabic and English database columns
 *
 * USE CASE: Creating announcements, lessons, or any bilingual content
 * User enters title in English → Auto-translates to Arabic → Stores both titleEn + titleAr
 *
 * KEY FUNCTIONS:
 * 1. withAutoTranslation(): Translate specified fields, append to data object
 * 2. getLocalizedField(): Extract correct language version from bilingual entity
 * 3. prepareBilingualData(): Format data for Prisma create/update with all variants
 *
 * DATA TRANSFORMATION:
 * Input: { title: "Hello", description: "World", priority: "HIGH" }
 * Output: {
 *   title: "Hello",
 *   description: "World",
 *   titleEn: "Hello",
 *   titleAr: "مرحبا",
 *   descriptionEn: "World",
 *   descriptionAr: "العالم",
 *   priority: "HIGH",           // Non-translatable fields unchanged
 *   sourceLanguage: "en"
 * }
 *
 * ARCHITECTURE:
 * - Delegates to translateFields() (actual translation service)
 * - Handles error cases (returns empty strings for target language)
 * - Preserves source language fields even if translation fails
 * - Adds metadata (sourceLanguage) for future reference
 *
 * TRANSLATION SERVICE:
 * - Uses Groq AI (free tier available)
 * - Fallback: Returns untranslated (empty fields) on error
 * - Network errors don't break form submission
 *
 * CONSTRAINTS & GOTCHAS:
 * - CRITICAL: Must pass translatableFields explicitly
 *   withAutoTranslation() only translates fields you specify
 * - Empty/whitespace-only fields are skipped (no translation)
 * - Translation failure doesn't prevent data save (target fields empty)
 * - sourceLanguage must be "en" or "ar" (determines suffix logic)
 * - Type safety: Field names must match entity interface keys
 *
 * ERROR HANDLING:
 * - Translation API timeout: Filled with empty strings, success=false
 * - Network error: Caught and logged, data still returned
 * - Invalid language: sourceLanguage must be en/ar (no fallback)
 *
 * PERFORMANCE:
 * - One API call per translation (groups all fields in single request)
 * - Network request adds 1-3 seconds to form submission
 * - Should show loading state during translation
 *
 * INTEGRATION:
 * ```ts
 * // In server action
 * const translated = await withAutoTranslation(
 *   { title: formData.get("title"), body: formData.get("body") },
 *   ["title", "body"],
 *   "en"
 * );
 *
 * const dbData = prepareBilingualData(
 *   translated.data,
 *   translated.data,
 *   ["title", "body"],
 *   "en"
 * );
 *
 * await db.announcement.create({ data: dbData });
 * ```
 */

import { translateFields } from "./translate"

type SupportedLanguage = "en" | "ar"

interface TranslationResult<T> {
  success: boolean
  data: T
  translatedFields?: Record<string, string>
  error?: string
}

/**
 * Automatically translate specified fields and append language-suffixed versions.
 *
 * @param data - The original form data object
 * @param translatableFields - Array of field names to translate
 * @param sourceLanguage - The language of the source content ("en" or "ar")
 * @returns The original data merged with translated fields (suffixed)
 *
 * @example
 * // User inputs in English
 * const input = { title: "Hello", description: "World" };
 * const result = await withAutoTranslation(input, ["title", "description"], "en");
 * // result.data = {
 * //   title: "Hello",
 * //   description: "World",
 * //   titleAr: "مرحبا",
 * //   descriptionAr: "العالم"
 * // }
 */
export async function withAutoTranslation<T extends Record<string, unknown>>(
  data: T,
  translatableFields: (keyof T)[],
  sourceLanguage: SupportedLanguage
): Promise<TranslationResult<T & Record<string, string>>> {
  const targetSuffix = sourceLanguage === "en" ? "Ar" : "En"
  const sourceSuffix = sourceLanguage === "en" ? "En" : "Ar"

  // Extract only the fields that need translation
  const fieldsToTranslate: Record<string, string> = {}
  for (const field of translatableFields) {
    const value = data[field]
    if (typeof value === "string" && value.trim() !== "") {
      fieldsToTranslate[String(field)] = value
    }
  }

  // If no fields to translate, return original data with source suffix
  if (Object.keys(fieldsToTranslate).length === 0) {
    const additionalFields: Record<string, string> = {}
    // Add source language suffixes for empty fields
    for (const field of translatableFields) {
      const value = data[field]
      if (typeof value === "string") {
        additionalFields[`${String(field)}${sourceSuffix}`] = value
        additionalFields[`${String(field)}${targetSuffix}`] = ""
      }
    }
    return {
      success: true,
      data: { ...data, ...additionalFields } as T & Record<string, string>,
    }
  }

  try {
    // Call the translation service
    const result = await translateFields({
      fields: fieldsToTranslate,
      sourceLanguage,
    })

    // Build additional fields separately to avoid TypeScript indexing issues
    const additionalFields: Record<string, string> = {}

    // Add source language suffixed fields
    for (const field of translatableFields) {
      const value = data[field]
      if (typeof value === "string") {
        additionalFields[`${String(field)}${sourceSuffix}`] = value
      }
    }

    // Add translated fields
    if (result.success && result.translated) {
      for (const [key, value] of Object.entries(result.translated)) {
        additionalFields[`${key}${targetSuffix}`] = value
      }
      return {
        success: true,
        data: { ...data, ...additionalFields } as T & Record<string, string>,
        translatedFields: result.translated,
      }
    }

    // Translation failed - fill target fields with empty strings
    for (const field of translatableFields) {
      additionalFields[`${String(field)}${targetSuffix}`] = ""
    }

    return {
      success: false,
      data: { ...data, ...additionalFields } as T & Record<string, string>,
      error: result.error || "Translation failed",
    }
  } catch (error) {
    console.error("[withAutoTranslation] Error:", error)

    // Return original data with empty target fields on error
    const additionalFields: Record<string, string> = {}
    for (const field of translatableFields) {
      const value = data[field]
      if (typeof value === "string") {
        additionalFields[`${String(field)}${sourceSuffix}`] = value
        additionalFields[`${String(field)}${targetSuffix}`] = ""
      }
    }

    return {
      success: false,
      data: { ...data, ...additionalFields } as T & Record<string, string>,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}

/**
 * Helper to get the localized value from a bilingual entity.
 *
 * @param entity - The entity with bilingual fields (e.g., { titleEn, titleAr })
 * @param fieldName - The base field name (e.g., "title")
 * @param locale - The current locale ("en" or "ar")
 * @returns The localized value, falling back to English if not available
 *
 * @example
 * const title = getLocalizedField(announcement, "title", "ar");
 * // Returns announcement.titleAr if available, else announcement.titleEn
 */
export function getLocalizedField<T extends Record<string, unknown>>(
  entity: T,
  fieldName: string,
  locale: SupportedLanguage
): string {
  const suffix = locale === "ar" ? "Ar" : "En"
  const fallbackSuffix = locale === "ar" ? "En" : "Ar"

  const primaryField = `${fieldName}${suffix}`
  const fallbackField = `${fieldName}${fallbackSuffix}`

  const value = entity[primaryField]
  if (typeof value === "string" && value.trim() !== "") {
    return value
  }

  const fallback = entity[fallbackField]
  if (typeof fallback === "string") {
    return fallback
  }

  return ""
}

/**
 * Prepare data for database insertion with both language versions.
 *
 * @param sourceData - The data with base field names
 * @param translatedData - The translation result from withAutoTranslation
 * @param translatableFields - Fields that have bilingual versions
 * @param sourceLanguage - The source language
 * @returns Object ready for Prisma create/update
 *
 * @example
 * const dbData = prepareBilingualData(
 *   { title: "Hello", priority: "HIGH" },
 *   translationResult.data,
 *   ["title"],
 *   "en"
 * );
 * // Returns: { titleEn: "Hello", titleAr: "مرحبا", priority: "HIGH", sourceLanguage: "en" }
 */
export function prepareBilingualData<T extends Record<string, unknown>>(
  sourceData: T,
  translatedData: Record<string, unknown>,
  translatableFields: (keyof T)[],
  sourceLanguage: SupportedLanguage
): Record<string, unknown> {
  const result: Record<string, unknown> = { sourceLanguage }

  // Copy non-translatable fields as-is
  for (const [key, value] of Object.entries(sourceData)) {
    if (!translatableFields.includes(key as keyof T)) {
      result[key] = value
    }
  }

  // Copy bilingual fields from translated data
  for (const field of translatableFields) {
    const fieldStr = String(field)
    result[`${fieldStr}En`] = translatedData[`${fieldStr}En`] ?? ""
    result[`${fieldStr}Ar`] = translatedData[`${fieldStr}Ar`] ?? ""
  }

  return result
}
