/**
 * Auto-Translation Wrapper for Bilingual Entity Creation
 *
 * Provides automatic translation when creating entities that need
 * both Arabic and English content. Uses Groq AI for fast, free translation.
 *
 * Usage:
 * ```ts
 * const data = { title: "Welcome", body: "Hello everyone" };
 * const translated = await withAutoTranslation(data, ["title", "body"], "en");
 * // Returns: { title: "Welcome", body: "Hello everyone", titleAr: "أهلاً", bodyAr: "مرحباً بالجميع" }
 * ```
 */

import { translateFields } from "./translate";

type SupportedLanguage = "en" | "ar";

interface TranslationResult<T> {
  success: boolean;
  data: T;
  translatedFields?: Record<string, string>;
  error?: string;
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
  const targetSuffix = sourceLanguage === "en" ? "Ar" : "En";
  const sourceSuffix = sourceLanguage === "en" ? "En" : "Ar";

  // Extract only the fields that need translation
  const fieldsToTranslate: Record<string, string> = {};
  for (const field of translatableFields) {
    const value = data[field];
    if (typeof value === "string" && value.trim() !== "") {
      fieldsToTranslate[String(field)] = value;
    }
  }

  // If no fields to translate, return original data with source suffix
  if (Object.keys(fieldsToTranslate).length === 0) {
    const additionalFields: Record<string, string> = {};
    // Add source language suffixes for empty fields
    for (const field of translatableFields) {
      const value = data[field];
      if (typeof value === "string") {
        additionalFields[`${String(field)}${sourceSuffix}`] = value;
        additionalFields[`${String(field)}${targetSuffix}`] = "";
      }
    }
    return { success: true, data: { ...data, ...additionalFields } as T & Record<string, string> };
  }

  try {
    // Call the translation service
    const result = await translateFields({
      fields: fieldsToTranslate,
      sourceLanguage,
    });

    // Build additional fields separately to avoid TypeScript indexing issues
    const additionalFields: Record<string, string> = {};

    // Add source language suffixed fields
    for (const field of translatableFields) {
      const value = data[field];
      if (typeof value === "string") {
        additionalFields[`${String(field)}${sourceSuffix}`] = value;
      }
    }

    // Add translated fields
    if (result.success && result.translated) {
      for (const [key, value] of Object.entries(result.translated)) {
        additionalFields[`${key}${targetSuffix}`] = value;
      }
      return {
        success: true,
        data: { ...data, ...additionalFields } as T & Record<string, string>,
        translatedFields: result.translated,
      };
    }

    // Translation failed - fill target fields with empty strings
    for (const field of translatableFields) {
      additionalFields[`${String(field)}${targetSuffix}`] = "";
    }

    return {
      success: false,
      data: { ...data, ...additionalFields } as T & Record<string, string>,
      error: result.error || "Translation failed",
    };
  } catch (error) {
    console.error("[withAutoTranslation] Error:", error);

    // Return original data with empty target fields on error
    const additionalFields: Record<string, string> = {};
    for (const field of translatableFields) {
      const value = data[field];
      if (typeof value === "string") {
        additionalFields[`${String(field)}${sourceSuffix}`] = value;
        additionalFields[`${String(field)}${targetSuffix}`] = "";
      }
    }

    return {
      success: false,
      data: { ...data, ...additionalFields } as T & Record<string, string>,
      error: error instanceof Error ? error.message : "Translation failed",
    };
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
  const suffix = locale === "ar" ? "Ar" : "En";
  const fallbackSuffix = locale === "ar" ? "En" : "Ar";

  const primaryField = `${fieldName}${suffix}`;
  const fallbackField = `${fieldName}${fallbackSuffix}`;

  const value = entity[primaryField];
  if (typeof value === "string" && value.trim() !== "") {
    return value;
  }

  const fallback = entity[fallbackField];
  if (typeof fallback === "string") {
    return fallback;
  }

  return "";
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
  const result: Record<string, unknown> = { sourceLanguage };

  // Copy non-translatable fields as-is
  for (const [key, value] of Object.entries(sourceData)) {
    if (!translatableFields.includes(key as keyof T)) {
      result[key] = value;
    }
  }

  // Copy bilingual fields from translated data
  for (const field of translatableFields) {
    const fieldStr = String(field);
    result[`${fieldStr}En`] = translatedData[`${fieldStr}En`] ?? "";
    result[`${fieldStr}Ar`] = translatedData[`${fieldStr}Ar`] ?? "";
  }

  return result;
}
