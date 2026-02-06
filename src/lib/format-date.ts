import { format as dateFnsFormat } from "date-fns"
import { ar, enUS } from "date-fns/locale"

const localeMap = {
  ar: ar,
  en: enUS,
} as const

type SupportedLocale = keyof typeof localeMap

/**
 * Get the date-fns locale object for a given locale string.
 */
export function getDateLocale(locale: string) {
  return localeMap[locale as SupportedLocale] || enUS
}

/**
 * Format a date using date-fns with locale support.
 *
 * @param date - The date to format
 * @param formatStr - date-fns format string (e.g., "PPP", "yyyy-MM-dd")
 * @param locale - Locale string ("ar" | "en")
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string,
  locale = "en"
) {
  const d = date instanceof Date ? date : new Date(date)
  return dateFnsFormat(d, formatStr, { locale: getDateLocale(locale) })
}

/**
 * Locale-aware toLocaleDateString replacement.
 * Maps "ar"/"en" to proper BCP 47 locale tags.
 */
export function localeDateString(
  date: Date | string | number,
  locale = "en",
  options?: Intl.DateTimeFormatOptions
) {
  const d = date instanceof Date ? date : new Date(date)
  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  return d.toLocaleDateString(bcp47, options)
}

/**
 * Locale-aware toLocaleTimeString replacement.
 */
export function localeTimeString(
  date: Date | string | number,
  locale = "en",
  options?: Intl.DateTimeFormatOptions
) {
  const d = date instanceof Date ? date : new Date(date)
  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  return d.toLocaleTimeString(bcp47, options)
}

/**
 * Locale-aware toLocaleString replacement (date + time).
 */
export function localeString(
  date: Date | string | number,
  locale = "en",
  options?: Intl.DateTimeFormatOptions
) {
  const d = date instanceof Date ? date : new Date(date)
  const bcp47 = locale === "ar" ? "ar-SA" : "en-US"
  return d.toLocaleString(bcp47, options)
}
