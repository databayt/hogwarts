// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export const i18n = {
  defaultLocale: "ar",
  locales: ["en", "ar"], // Add your supported locales
} as const

export type Locale = (typeof i18n)["locales"][number]

// Locale metadata for enhanced functionality
export const localeConfig = {
  en: {
    name: "English",
    nativeName: "English",
    dir: "ltr",
    flag: "🇺🇸",
    dateFormat: "MM/dd/yyyy",
    currency: "USD",
  },
  ar: {
    name: "Arabic",
    nativeName: "العربية",
    dir: "rtl",
    flag: "🇸🇦",
    dateFormat: "dd/MM/yyyy",
    currency: "SAR",
  },
} as const

export function isRTL(locale: Locale): boolean {
  return localeConfig[locale]?.dir === "rtl"
}
