"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { translateBatch, translateRaw } from "./google"
import { memoGet, memoSet } from "./memory-cache"
import type {
  Lang,
  TranslateFieldsInput,
  TranslateFieldsResult,
  TranslateTextInput,
  TranslateTextResult,
  TranslationResult,
} from "./types"

/**
 * Translate with three-tier caching: in-memory LRU (hot short terms,
 * zero round-trips) → Translation DB cache → Google Translate API.
 * Every legacy caller (getText/getFields/getName/getLabels) inherits the
 * LRU through this single path.
 */
export async function translate(
  text: string,
  sourceLang: "en" | "ar",
  targetLang: "en" | "ar",
  schoolId: string
): Promise<string> {
  if (!text || text.trim() === "") return ""
  if (sourceLang === targetLang) return text

  const memo = memoGet(schoolId, sourceLang, targetLang, text)
  if (memo !== undefined) return memo

  // Check DB cache
  const cached = await db.translation.findUnique({
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
    db.translation
      .update({
        where: { id: cached.id },
        data: {
          hitCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      })
      .catch(() => {})

    memoSet(schoolId, sourceLang, targetLang, text, cached.translatedText)
    return cached.translatedText
  }

  // Translate via Google
  const translated = await translateRaw(text, sourceLang, targetLang)

  // Cache the result
  await db.translation
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

  memoSet(schoolId, sourceLang, targetLang, text, translated)
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
    const translated = await translate(
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
    const translations = await translateBatch(
      texts,
      input.sourceLanguage,
      targetLang
    )

    // Cache all results
    await Promise.allSettled(
      texts.map((text, i) =>
        db.translation
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
export async function autoTranslate<T extends Record<string, unknown>>(
  data: T,
  translatableFields: (keyof T)[],
  sourceLanguage: Lang
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
    console.error("[autoTranslate] Error:", error)
    return {
      success: false,
      data: resultData,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}
