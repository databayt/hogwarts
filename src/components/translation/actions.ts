"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { googleTranslate, googleTranslateBatch } from "./google"
import type {
  SupportedLanguage,
  TranslateFieldsInput,
  TranslateFieldsResult,
  TranslateTextInput,
  TranslateTextResult,
  TranslationResult,
} from "./types"

/**
 * Translate with database caching via TranslationCache model.
 * Checks cache first, falls back to Google Translate API.
 */
export async function translateWithCache(
  text: string,
  sourceLang: "en" | "ar",
  targetLang: "en" | "ar",
  schoolId: string
): Promise<string> {
  if (!text || text.trim() === "") return ""
  if (sourceLang === targetLang) return text

  // Check cache first
  const cached = await db.translationCache.findUnique({
    where: {
      schoolId_sourceText_sourceLanguage_targetLanguage: {
        schoolId,
        sourceText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      },
    },
  })

  if (cached) {
    // Update hit count and last accessed (fire-and-forget)
    db.translationCache
      .update({
        where: { id: cached.id },
        data: {
          hitCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      })
      .catch(() => {})

    return cached.translatedText
  }

  // Translate via Google
  const translated = await googleTranslate(text, sourceLang, targetLang)

  // Cache the result
  await db.translationCache
    .create({
      data: {
        schoolId,
        sourceText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        translatedText: translated,
        provider: "google",
      },
    })
    .catch(() => {
      // Ignore duplicate key errors from race conditions
    })

  return translated
}

/**
 * Translate a single text using Google Translate API with caching
 */
export async function translateText(
  input: TranslateTextInput
): Promise<TranslateTextResult> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Not authenticated" }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  if (!input.text || input.text.trim() === "") {
    return { success: true, translated: "" }
  }

  const targetLang = input.sourceLanguage === "en" ? "ar" : "en"

  try {
    const translated = await translateWithCache(
      input.text,
      input.sourceLanguage,
      targetLang,
      schoolId
    )
    return { success: true, translated }
  } catch (error) {
    console.error("[translateText] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}

/**
 * Translate multiple fields in parallel using Google Translate API with caching
 */
export async function translateFields(
  input: TranslateFieldsInput
): Promise<TranslateFieldsResult> {
  const session = await auth()
  if (!session?.user) {
    return { success: false, error: "Not authenticated" }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { success: false, error: "Missing school context" }
  }

  const targetLang = input.sourceLanguage === "en" ? "ar" : "en"

  try {
    const entries = Object.entries(input.fields).filter(
      ([, value]) => value && value.trim() !== ""
    )

    if (entries.length === 0) {
      return { success: true, translated: {} }
    }

    const keys = entries.map(([key]) => key)
    const texts = entries.map(([, value]) => value)

    // Batch translate for efficiency
    const translations = await googleTranslateBatch(
      texts,
      input.sourceLanguage,
      targetLang
    )

    // Cache all results
    await Promise.allSettled(
      texts.map((text, i) =>
        db.translationCache
          .upsert({
            where: {
              schoolId_sourceText_sourceLanguage_targetLanguage: {
                schoolId,
                sourceText: text,
                sourceLanguage: input.sourceLanguage,
                targetLanguage: targetLang,
              },
            },
            update: {
              translatedText: translations[i] ?? "",
              hitCount: { increment: 1 },
              lastAccessedAt: new Date(),
            },
            create: {
              schoolId,
              sourceText: text,
              sourceLanguage: input.sourceLanguage,
              targetLanguage: targetLang,
              translatedText: translations[i] ?? "",
              provider: "google",
            },
          })
          .catch(() => {})
      )
    )

    const translated = Object.fromEntries(
      keys.map((key, i) => [key, translations[i] ?? ""])
    )

    return { success: true, translated }
  } catch (error) {
    console.error("[translateFields] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}

/**
 * Auto-translate fields for the user (optional UX enhancement).
 * Translates specified fields and returns the translated versions
 * alongside the original. Used when admin wants to preview translation.
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
