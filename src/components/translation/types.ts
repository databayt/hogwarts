// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Translation system types
 */

export type Lang = "en" | "ar"

export interface TranslateTextInput {
  text: string
  sourceLanguage: Lang
}

export interface TranslateTextResult {
  success: boolean
  translated?: string
  error?: string
}

export interface TranslateFieldsInput {
  fields: Record<string, string>
  sourceLanguage: Lang
}

export interface TranslateFieldsResult {
  success: boolean
  translated?: Record<string, string>
  error?: string
}

export interface TranslationResult<T> {
  success: boolean
  data: T & { lang: Lang }
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
