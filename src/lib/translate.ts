"use server"

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { googleTranslate, googleTranslateBatch } from "@/lib/google-translate"
import { getTenantContext } from "@/lib/tenant-context"

interface TranslateTextInput {
  text: string
  sourceLanguage: "en" | "ar"
}

interface TranslateTextResult {
  success: boolean
  translated?: string
  error?: string
}

interface TranslateFieldsInput {
  fields: Record<string, string>
  sourceLanguage: "en" | "ar"
}

interface TranslateFieldsResult {
  success: boolean
  translated?: Record<string, string>
  error?: string
}

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
