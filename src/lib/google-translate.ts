"use server"

/**
 * Google Cloud Translation API v2 wrapper
 * Provides batch translation support with error handling
 *
 * Env var: GOOGLE_TRANSLATE_API_KEY
 * Free tier: 500K chars/month
 */

const GOOGLE_TRANSLATE_API_URL =
  "https://translation.googleapis.com/language/translate/v2"

interface TranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}

/**
 * Translate a single text using Google Cloud Translation API
 */
export async function googleTranslate(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY not configured")
  }

  if (!text || text.trim() === "") return ""

  const params = new URLSearchParams({
    q: text,
    source: sourceLang,
    target: targetLang,
    key: apiKey,
    format: "text",
  })

  const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?${params}`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Translate API error: ${response.status} - ${error}`)
  }

  const result = (await response.json()) as TranslateResponse
  return result.data.translations[0]?.translatedText ?? ""
}

/**
 * Batch translate multiple texts in a single API call
 * More efficient than individual calls for multiple fields
 */
export async function googleTranslateBatch(
  texts: string[],
  sourceLang: string,
  targetLang: string
): Promise<string[]> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_TRANSLATE_API_KEY not configured")
  }

  const nonEmpty = texts.filter((t) => t && t.trim() !== "")
  if (nonEmpty.length === 0) return texts.map(() => "")

  const params = new URLSearchParams({
    source: sourceLang,
    target: targetLang,
    key: apiKey,
    format: "text",
  })

  // Google Translate API accepts multiple `q` params
  for (const text of texts) {
    if (text && text.trim() !== "") {
      params.append("q", text)
    }
  }

  const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?${params}`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google Translate API error: ${response.status} - ${error}`)
  }

  const result = (await response.json()) as TranslateResponse
  const translations = result.data.translations

  // Map back to original positions (empty strings stay empty)
  let translationIndex = 0
  return texts.map((text) => {
    if (!text || text.trim() === "") return ""
    return translations[translationIndex++]?.translatedText ?? ""
  })
}
