/**
 * Internationalization Format Utilities
 *
 * Provides locale-aware formatting for Arabic (ar) and English (en).
 *
 * KEY BEHAVIORS:
 *
 * 1. ARABIC NUMERAL SYSTEM:
 *    - Arabic locale uses Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩)
 *    - Intl.NumberFormat handles this automatically
 *    - No manual conversion needed
 *
 * 2. CURRENCY MAPPING:
 *    - 'en' → USD (United States Dollar)
 *    - 'ar' → SAR (Saudi Riyal)
 *    - Defined in localeConfig
 *
 * 3. DATE FORMAT DIFFERENCES:
 *    - English: MM/DD/YYYY (US format)
 *    - Arabic: DD/MM/YYYY (Day-first)
 *    - Both respect RTL/LTR directionality
 *
 * GOTCHAS:
 *
 * - formatDateRange uses Intl.DateTimeFormat.formatRange()
 *   which isn't supported in all browsers. Falls back to manual formatting.
 *
 * - formatDuration has hardcoded Arabic strings for units
 *   because Intl doesn't have a duration formatter.
 *
 * - formatFileSize uses Arabic unit names (بايت, كيلوبايت)
 *   because Intl.NumberFormat doesn't handle file size units.
 */

import { Locale, localeConfig } from '@/components/internationalization/config';

/**
 * Formats a number as currency based on the locale
 * @param value - The numeric value to format
 * @param locale - The locale to use for formatting
 * @param options - Optional Intl.NumberFormatOptions to override defaults
 * @returns Formatted currency string (e.g., "$1,234.56" or "١٬٢٣٤٫٥٦ ر.س")
 * @example
 * formatCurrency(1234.56, 'en') // "$1,234.56"
 * formatCurrency(1234.56, 'ar') // "١٬٢٣٤٫٥٦ ر.س"
 */
export function formatCurrency(
  value: number | null | undefined,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) {
    return formatCurrency(0, locale, options);
  }

  const currency = localeConfig[locale].currency;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options,
  }).format(value);
}

/**
 * Formats a date based on the locale
 * @param date - The date to format (Date object or ISO string)
 * @param locale - The locale to use for formatting
 * @param options - Optional Intl.DateTimeFormatOptions to override defaults
 * @returns Formatted date string based on locale settings
 * @example
 * formatDate(new Date('2024-03-15'), 'en') // "03/15/2024"
 * formatDate(new Date('2024-03-15'), 'ar') // "15/03/2024"
 */
export function formatDate(
  date: Date | string | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  // If no options provided, use a default format that respects locale
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj);
}

/**
 * Formats a date with time based on the locale
 * @param date - The date to format (Date object or ISO string)
 * @param locale - The locale to use for formatting
 * @param options - Optional Intl.DateTimeFormatOptions to override defaults
 * @returns Formatted date and time string
 * @example
 * formatDateTime(new Date('2024-03-15T14:30:00'), 'en') // "03/15/2024, 2:30 PM"
 * formatDateTime(new Date('2024-03-15T14:30:00'), 'ar') // "15/03/2024, 2:30 م"
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) {
    return '';
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(locale, options || defaultOptions).format(dateObj);
}

/**
 * Formats a number based on the locale
 * @param value - The numeric value to format
 * @param locale - The locale to use for formatting
 * @param options - Optional Intl.NumberFormatOptions
 * @returns Formatted number string
 * @example
 * formatNumber(1234567.89, 'en') // "1,234,567.89"
 * formatNumber(1234567.89, 'ar') // "١٬٢٣٤٬٥٦٧٫٨٩"
 */
export function formatNumber(
  value: number | null | undefined,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) {
    return formatNumber(0, locale, options);
  }

  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Formats a number as a percentage based on the locale
 * @param value - The numeric value to format (0-1 for 0%-100%, or raw number if useRawValue is true)
 * @param locale - The locale to use for formatting
 * @param options - Optional Intl.NumberFormatOptions to override defaults
 * @returns Formatted percentage string
 * @example
 * formatPercentage(0.1234, 'en') // "12.34%"
 * formatPercentage(0.1234, 'ar') // "٪؜١٢٫٣٤"
 * formatPercentage(85, 'en', { useRawValue: true }) // "85%"
 */
export function formatPercentage(
  value: number | null | undefined,
  locale: Locale,
  options?: Intl.NumberFormatOptions & { useRawValue?: boolean }
): string {
  if (value === null || value === undefined) {
    return formatPercentage(0, locale, options);
  }

  const { useRawValue, ...intlOptions } = options || {};
  const numericValue = useRawValue ? value / 100 : value;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...intlOptions,
  }).format(numericValue);
}

/**
 * Formats a relative time (e.g., "2 days ago", "in 3 hours")
 * @param date - The date to compare against now
 * @param locale - The locale to use for formatting
 * @param baseDate - Optional base date to compare against (defaults to now)
 * @returns Formatted relative time string
 * @example
 * formatRelativeTime(new Date(Date.now() - 86400000 * 2), 'en') // "2 days ago"
 * formatRelativeTime(new Date(Date.now() - 86400000 * 2), 'ar') // "قبل يومين"
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
  locale: Locale,
  baseDate: Date = new Date()
): string {
  if (!date) {
    return '';
  }

  const targetDate = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(targetDate.getTime())) {
    return '';
  }

  const diffInSeconds = Math.floor((targetDate.getTime() - baseDate.getTime()) / 1000);
  const absDiff = Math.abs(diffInSeconds);

  // Define time units in seconds
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  // Find the appropriate unit
  for (const { unit, seconds } of units) {
    if (absDiff >= seconds) {
      const value = Math.floor(diffInSeconds / seconds);
      return new Intl.RelativeTimeFormat(locale, {
        numeric: 'auto',
        style: 'long',
      }).format(value, unit);
    }
  }

  // If less than a second
  return new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: 'long',
  }).format(0, 'second');
}

/**
 * Formats a date range based on the locale
 * @param startDate - The start date
 * @param endDate - The end date
 * @param locale - The locale to use for formatting
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date range string
 * @example
 * formatDateRange(new Date('2024-03-15'), new Date('2024-03-20'), 'en') // "03/15/2024 – 03/20/2024"
 * formatDateRange(new Date('2024-03-15'), new Date('2024-03-20'), 'ar') // "15/03/2024 – 20/03/2024"
 */
export function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  locale: Locale,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!startDate || !endDate) {
    return '';
  }

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  };

  try {
    // WHY @ts-ignore: formatRange exists in modern browsers but TypeScript
    // lib.dom.d.ts doesn't include it yet. Will be resolved in future TS versions.
    // @ts-ignore - formatRange is available but TypeScript might not recognize it
    return new Intl.DateTimeFormat(locale, options || defaultOptions).formatRange(start, end);
  } catch {
    // GOTCHA: formatRange not supported in Safari < 14.1, Node < 16.7
    // Fallback concatenates individual dates with en-dash separator
    const formattedStart = formatDate(start, locale, options);
    const formattedEnd = formatDate(end, locale, options);
    return `${formattedStart} – ${formattedEnd}`;
  }
}

/**
 * Formats a file size in bytes to a human-readable string
 *
 * WHY HARDCODED ARABIC STRINGS:
 * Intl.NumberFormat doesn't support file size units. We manually provide
 * Arabic translations for unit names (بايت = Bytes, كيلوبايت = KB, etc.)
 *
 * @param bytes - The file size in bytes
 * @param locale - The locale to use for formatting
 * @param decimals - Number of decimal places to show (default: 2)
 * @returns Formatted file size string
 * @example
 * formatFileSize(1024, 'en') // "1 KB"
 * formatFileSize(1048576, 'ar') // "١ ميجابايت"
 */
export function formatFileSize(
  bytes: number | null | undefined,
  locale: Locale,
  decimals: number = 2
): string {
  if (bytes === null || bytes === undefined || bytes === 0) {
    return locale === 'ar' ? '٠ بايت' : '0 Bytes';
  }

  const k = 1024; // Binary prefix (KiB = 1024, not 1000)
  const dm = decimals < 0 ? 0 : decimals;
  // WHY NOT Intl: No standard API for file size units
  // Manual translations maintained here
  const sizes = locale === 'ar'
    ? ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت', 'تيرابايت']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${formatNumber(value, locale, {
    minimumFractionDigits: dm,
    maximumFractionDigits: dm
  })} ${sizes[i]}`;
}

/**
 * Formats a compact number (e.g., 1.2K, 3.4M)
 * @param value - The numeric value to format
 * @param locale - The locale to use for formatting
 * @param options - Optional Intl.NumberFormatOptions
 * @returns Formatted compact number string
 * @example
 * formatCompactNumber(1234, 'en') // "1.2K"
 * formatCompactNumber(1234567, 'ar') // "١٫٢ مليون"
 */
export function formatCompactNumber(
  value: number | null | undefined,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) {
    return formatCompactNumber(0, locale, options);
  }

  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
    ...options,
  }).format(value);
}

/**
 * Formats a duration in milliseconds to a human-readable string
 *
 * WHY MANUAL IMPLEMENTATION:
 * Intl.DurationFormat is still in proposal stage (Stage 3 as of 2024).
 * Until browser support improves, we manually construct duration strings.
 *
 * ARABIC GRAMMAR NOTES:
 * - Singular: يوم (day), ساعة (hour), دقيقة (minute), ثانية (second)
 * - Plural: أيام (days), ساعات (hours), دقائق (minutes), ثوان (seconds)
 * - Arabic uses singular for 1, different plurals for 2-10, 11+
 *   Simplified here to singular (1) vs plural (>1)
 *
 * @param milliseconds - The duration in milliseconds
 * @param locale - The locale to use for formatting
 * @returns Formatted duration string
 * @example
 * formatDuration(3661000, 'en') // "1 hour, 1 minute, 1 second"
 * formatDuration(3661000, 'ar') // "١ ساعة، ١ دقيقة، ١ ثانية"
 */
export function formatDuration(
  milliseconds: number | null | undefined,
  locale: Locale
): string {
  if (milliseconds === null || milliseconds === undefined || milliseconds === 0) {
    return locale === 'ar' ? '٠ ثانية' : '0 seconds';
  }

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(
      locale === 'ar'
        ? `${formatNumber(days, locale)} ${days === 1 ? 'يوم' : 'أيام'}`
        : `${days} ${days === 1 ? 'day' : 'days'}`
    );
  }

  if (hours % 24 > 0) {
    const h = hours % 24;
    parts.push(
      locale === 'ar'
        ? `${formatNumber(h, locale)} ${h === 1 ? 'ساعة' : 'ساعات'}`
        : `${h} ${h === 1 ? 'hour' : 'hours'}`
    );
  }

  if (minutes % 60 > 0) {
    const m = minutes % 60;
    parts.push(
      locale === 'ar'
        ? `${formatNumber(m, locale)} ${m === 1 ? 'دقيقة' : 'دقائق'}`
        : `${m} ${m === 1 ? 'minute' : 'minutes'}`
    );
  }

  if (seconds % 60 > 0 && days === 0 && hours === 0) {
    const s = seconds % 60;
    parts.push(
      locale === 'ar'
        ? `${formatNumber(s, locale)} ${s === 1 ? 'ثانية' : 'ثوان'}`
        : `${s} ${s === 1 ? 'second' : 'seconds'}`
    );
  }

  return parts.join(locale === 'ar' ? '، ' : ', ');
}

/**
 * Formats a list of items based on the locale
 * @param items - Array of items to format
 * @param locale - The locale to use for formatting
 * @param type - Type of list formatting ('conjunction' | 'disjunction' | 'unit')
 * @returns Formatted list string
 * @example
 * formatList(['apples', 'oranges', 'bananas'], 'en') // "apples, oranges, and bananas"
 * formatList(['تفاح', 'برتقال', 'موز'], 'ar') // "تفاح وبرتقال وموز"
 */
export function formatList(
  items: string[],
  locale: Locale,
  type: 'conjunction' | 'disjunction' | 'unit' = 'conjunction'
): string {
  if (!items || items.length === 0) {
    return '';
  }

  return new Intl.ListFormat(locale, {
    style: 'long',
    type,
  }).format(items);
}
