/**
 * AI-Powered Auto-Translation Service
 *
 * Provides dynamic translation for attendance communications.
 *
 * SUPPORTED LANGUAGES:
 * - Arabic (ar) - Primary RTL language
 * - English (en) - Primary LTR language
 * - Extensible to additional languages
 *
 * USE CASES:
 * - Absence notifications to parents
 * - Compliance letters
 * - Intervention communications
 * - Custom messages
 *
 * FEATURES:
 * - Context-aware translation (educational context)
 * - Formal tone for parent communications
 * - Preserves placeholders like {{studentName}}
 * - Caches common translations
 */

import OpenAI from "openai"

import { AIErrorType, AIServiceError, DEFAULT_AI_CONFIG } from "./config"
import { aiRateLimiter } from "./rate-limiter"

// Initialize OpenAI client
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new AIServiceError(
        "OpenAI API key not configured",
        AIErrorType.AUTH_ERROR,
        false
      )
    }
    openaiClient = new OpenAI({ apiKey })
  }
  return openaiClient
}

function isAIServiceAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY
}

// Language configuration
export const SUPPORTED_LANGUAGES = {
  ar: { name: "Arabic", nativeName: "العربية", direction: "rtl" },
  en: { name: "English", nativeName: "English", direction: "ltr" },
} as const

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES

// Translation cache for common phrases
const translationCache = new Map<string, Map<SupportedLanguage, string>>()

// Pre-defined translations for common attendance messages
const COMMON_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  "Your child was marked absent today": {
    en: "Your child was marked absent today",
    ar: "تم تسجيل غياب طفلك اليوم",
  },
  "Your child arrived late today": {
    en: "Your child arrived late today",
    ar: "وصل طفلك متأخراً اليوم",
  },
  "Please contact the school": {
    en: "Please contact the school",
    ar: "يرجى التواصل مع المدرسة",
  },
  "Thank you for your cooperation": {
    en: "Thank you for your cooperation",
    ar: "شكراً لتعاونكم",
  },
  "Attendance Notice": {
    en: "Attendance Notice",
    ar: "إشعار الحضور",
  },
  "Urgent: Attendance Concern": {
    en: "Urgent: Attendance Concern",
    ar: "عاجل: قلق بشأن الحضور",
  },
}

export interface TranslationResult {
  success: boolean
  translatedText: string
  sourceLanguage: SupportedLanguage
  targetLanguage: SupportedLanguage
  confidence: number
  usedCache: boolean
  error?: string
}

export interface BatchTranslationResult {
  translations: TranslationResult[]
  stats: {
    total: number
    successful: number
    failed: number
    cached: number
  }
}

/**
 * Detect the language of text
 */
export function detectLanguage(text: string): SupportedLanguage {
  // Simple detection based on character ranges
  const arabicPattern = /[\u0600-\u06FF]/
  const hasArabic = arabicPattern.test(text)

  // Count Arabic vs Latin characters
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length

  if (hasArabic && arabicChars > latinChars) {
    return "ar"
  }
  return "en"
}

/**
 * Check if translation is in cache
 */
function getCachedTranslation(
  text: string,
  targetLanguage: SupportedLanguage
): string | null {
  // Check pre-defined translations
  if (COMMON_TRANSLATIONS[text]?.[targetLanguage]) {
    return COMMON_TRANSLATIONS[text][targetLanguage]
  }

  // Check runtime cache
  const cached = translationCache.get(text)
  if (cached?.has(targetLanguage)) {
    return cached.get(targetLanguage)!
  }

  return null
}

/**
 * Cache a translation
 */
function cacheTranslation(
  text: string,
  targetLanguage: SupportedLanguage,
  translation: string
): void {
  if (!translationCache.has(text)) {
    translationCache.set(text, new Map())
  }
  translationCache.get(text)!.set(targetLanguage, translation)
}

/**
 * Translate text to target language
 */
export async function translateText(
  text: string,
  targetLanguage: SupportedLanguage,
  context?: string
): Promise<TranslationResult> {
  const sourceLanguage = detectLanguage(text)

  // If already in target language, return as-is
  if (sourceLanguage === targetLanguage) {
    return {
      success: true,
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 1,
      usedCache: false,
    }
  }

  // Check cache first
  const cached = getCachedTranslation(text, targetLanguage)
  if (cached) {
    return {
      success: true,
      translatedText: cached,
      sourceLanguage,
      targetLanguage,
      confidence: 1,
      usedCache: true,
    }
  }

  // Use AI translation if available
  if (!isAIServiceAvailable()) {
    return {
      success: false,
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 0,
      usedCache: false,
      error: "Translation service not available",
    }
  }

  try {
    const openai = getOpenAIClient()

    const targetLanguageName = SUPPORTED_LANGUAGES[targetLanguage].name
    const sourceLanguageName = SUPPORTED_LANGUAGES[sourceLanguage].name

    const prompt = `Translate the following ${sourceLanguageName} text to ${targetLanguageName}.

**Context:** ${context || "Educational/School communication to parents"}

**Requirements:**
1. Use formal, respectful tone appropriate for parent communication
2. Preserve any placeholders like {{studentName}}, {{date}}, etc.
3. Maintain the original meaning and intent
4. For Arabic: Use Modern Standard Arabic (فصحى)

**Text to translate:**
${text}

**Response Format (JSON):**
{
  "translatedText": "the translation",
  "confidence": number between 0 and 1
}`

    const response = await aiRateLimiter.enqueue(
      () =>
        openai.chat.completions.create({
          model: DEFAULT_AI_CONFIG.gradingModel,
          messages: [
            {
              role: "system",
              content:
                "You are a professional translator specializing in educational communications. Provide accurate, culturally appropriate translations.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 1000,
        }),
      0
    )

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from translation service")
    }

    const result = JSON.parse(content)

    // Cache the result
    cacheTranslation(text, targetLanguage, result.translatedText)

    return {
      success: true,
      translatedText: result.translatedText,
      sourceLanguage,
      targetLanguage,
      confidence: result.confidence || 0.9,
      usedCache: false,
    }
  } catch (error) {
    console.error("Translation error:", error)
    return {
      success: false,
      translatedText: text,
      sourceLanguage,
      targetLanguage,
      confidence: 0,
      usedCache: false,
      error: error instanceof Error ? error.message : "Translation failed",
    }
  }
}

/**
 * Translate multiple texts in batch
 */
export async function batchTranslate(
  texts: string[],
  targetLanguage: SupportedLanguage,
  context?: string
): Promise<BatchTranslationResult> {
  const results: TranslationResult[] = []
  let cached = 0
  let successful = 0
  let failed = 0

  // Process in parallel but with rate limiting consideration
  const BATCH_SIZE = 5
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map((text) => translateText(text, targetLanguage, context))
    )

    for (const result of batchResults) {
      results.push(result)
      if (result.success) {
        successful++
        if (result.usedCache) cached++
      } else {
        failed++
      }
    }

    // Small delay between batches
    if (i + BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200))
    }
  }

  return {
    translations: results,
    stats: {
      total: texts.length,
      successful,
      failed,
      cached,
    },
  }
}

/**
 * Translate attendance notification
 */
export async function translateAttendanceNotification(
  message: string,
  data: {
    studentName: string
    date: string
    schoolName: string
  },
  targetLanguage: SupportedLanguage
): Promise<TranslationResult> {
  // Replace placeholders with actual values for better context
  const messageWithValues = message
    .replace("{{studentName}}", data.studentName)
    .replace("{{date}}", data.date)
    .replace("{{schoolName}}", data.schoolName)

  const result = await translateText(
    messageWithValues,
    targetLanguage,
    "Attendance notification from school to parent"
  )

  // Restore placeholders in the translation if needed for template use
  if (result.success) {
    result.translatedText = result.translatedText
      .replace(data.studentName, "{{studentName}}")
      .replace(data.date, "{{date}}")
      .replace(data.schoolName, "{{schoolName}}")
  }

  return result
}

/**
 * Get localized date string
 */
export function getLocalizedDate(
  date: Date,
  language: SupportedLanguage
): string {
  const locale = language === "ar" ? "ar-SA" : "en-US"
  return date.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Get localized time string
 */
export function getLocalizedTime(
  date: Date,
  language: SupportedLanguage
): string {
  const locale = language === "ar" ? "ar-SA" : "en-US"
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(): void {
  translationCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  languages: SupportedLanguage[]
} {
  const languages = new Set<SupportedLanguage>()
  translationCache.forEach((translations) => {
    translations.forEach((_, lang) => languages.add(lang))
  })

  return {
    size: translationCache.size,
    languages: Array.from(languages),
  }
}
