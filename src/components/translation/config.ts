// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Translation system configuration
 */

export const GOOGLE_TRANSLATE_API_URL =
  "https://translation.googleapis.com/language/translate/v2"

export const SUPPORTED_LANGUAGES = {
  en: { name: "English", nativeName: "English", direction: "ltr" as const },
  ar: { name: "Arabic", nativeName: "العربية", direction: "rtl" as const },
} as const

export const DEFAULT_PROVIDER = "google" as const

export const TRANSLATABLE_FIELDS = [
  "title",
  "body",
  "name",
  "description",
] as const
