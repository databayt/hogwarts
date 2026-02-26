// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Translation system types
 */

export type SupportedLanguage = "en" | "ar"

export type ContentWithLang = {
  text: string
  lang: SupportedLanguage
}

export interface TranslateTextInput {
  text: string
  sourceLanguage: SupportedLanguage
}

export interface TranslateTextResult {
  success: boolean
  translated?: string
  error?: string
}

export interface TranslateFieldsInput {
  fields: Record<string, string>
  sourceLanguage: SupportedLanguage
}

export interface TranslateFieldsResult {
  success: boolean
  translated?: Record<string, string>
  error?: string
}

export interface TranslationResult<T> {
  success: boolean
  data: T & { lang: SupportedLanguage }
  error?: string
}

export interface TranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
      detectedSourceLanguage?: string
    }>
  }
}
