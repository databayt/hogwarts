/**
 * Unified File Block - Export Formatters
 * Data formatting utilities for exports
 */

import type { ExportColumn } from "./types";

// ============================================================================
// Value Formatters
// ============================================================================

/**
 * Format a value based on column type
 */
export function formatValue<T>(
  value: unknown,
  column: ExportColumn<T>,
  row: T,
  locale: string = "en"
): string {
  // Use custom formatter if provided
  if (column.format) {
    return column.format(value, row, locale);
  }

  // Handle null/undefined
  if (value === null || value === undefined) {
    return "";
  }

  // Format based on type
  switch (column.type) {
    case "number":
      return formatNumber(value, locale);

    case "currency":
      return formatCurrency(value, column.currency || "USD", locale);

    case "date":
      return formatDate(value, column.dateFormat, locale);

    case "boolean":
      return formatBoolean(value, locale);

    case "percentage":
      return formatPercentage(value, locale);

    case "string":
    default:
      return String(value);
  }
}

/**
 * Format number with locale
 */
export function formatNumber(value: unknown, locale: string = "en"): string {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) return "";

  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format currency with locale
 */
export function formatCurrency(
  value: unknown,
  currency: string = "USD",
  locale: string = "en"
): string {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) return "";

  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format date with locale
 */
export function formatDate(
  value: unknown,
  format?: string,
  locale: string = "en"
): string {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(String(value));
  if (isNaN(date.getTime())) return "";

  // Default formatting based on locale
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  // Custom format support (basic)
  if (format) {
    if (format.includes("HH") || format.includes("hh")) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }
    if (format.includes("ss")) {
      options.second = "2-digit";
    }
  }

  return new Intl.DateTimeFormat(
    locale === "ar" ? "ar-SA" : "en-US",
    options
  ).format(date);
}

/**
 * Format boolean with locale
 */
export function formatBoolean(value: unknown, locale: string = "en"): string {
  const bool = Boolean(value);
  if (locale === "ar") {
    return bool ? "نعم" : "لا";
  }
  return bool ? "Yes" : "No";
}

/**
 * Format percentage with locale
 */
export function formatPercentage(value: unknown, locale: string = "en"): string {
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(num)) return "";

  // Assume value is already a percentage (e.g., 75 for 75%)
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num / 100);
}

// ============================================================================
// Row Processing
// ============================================================================

/**
 * Get value from row using column accessor or key
 */
export function getValue<T>(row: T, column: ExportColumn<T>): unknown {
  if (column.accessor) {
    return column.accessor(row);
  }

  // Support nested keys with dot notation
  const keys = column.key.split(".");
  let value: unknown = row;

  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[key];
  }

  return value;
}

/**
 * Process a single row for export
 */
export function processRow<T>(
  row: T,
  columns: ExportColumn<T>[],
  locale: string = "en"
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const column of columns) {
    if (column.hidden) continue;

    const value = getValue(row, column);
    result[column.key] = formatValue(value, column, row, locale);
  }

  return result;
}

/**
 * Process all rows for export
 */
export function processRows<T>(
  data: T[],
  columns: ExportColumn<T>[],
  locale: string = "en"
): Array<Record<string, string>> {
  return data.map((row) => processRow(row, columns, locale));
}

// ============================================================================
// Header Helpers
// ============================================================================

/**
 * Get column header based on locale
 */
export function getHeader<T>(column: ExportColumn<T>, locale: string = "en"): string {
  if (locale === "ar" && column.headerAr) {
    return column.headerAr;
  }
  return column.header;
}

/**
 * Get all headers for columns
 */
export function getHeaders<T>(
  columns: ExportColumn<T>[],
  locale: string = "en"
): string[] {
  return columns
    .filter((col) => !col.hidden)
    .map((col) => getHeader(col, locale));
}

// ============================================================================
// Filename Helpers
// ============================================================================

/**
 * Sanitize filename for safe file system usage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "_")
    .slice(0, 200);
}

/**
 * Generate export filename with timestamp
 */
export function generateExportFilename(
  baseName: string,
  format: string,
  locale: string = "en"
): string {
  const timestamp = new Date().toISOString().split("T")[0];
  const sanitized = sanitizeFilename(baseName);
  return `${sanitized}_${timestamp}.${format}`;
}

// ============================================================================
// Column Helpers Factory
// ============================================================================

/**
 * Create column definition helpers
 */
export function createColumnHelpers<T>() {
  return {
    text: (key: keyof T & string, header: string, headerAr?: string): ExportColumn<T> => ({
      key,
      header,
      headerAr,
      type: "string",
    }),

    number: (key: keyof T & string, header: string, headerAr?: string): ExportColumn<T> => ({
      key,
      header,
      headerAr,
      type: "number",
      align: "right",
    }),

    currency: (
      key: keyof T & string,
      header: string,
      currency: string = "USD",
      headerAr?: string
    ): ExportColumn<T> => ({
      key,
      header,
      headerAr,
      type: "currency",
      currency,
      align: "right",
    }),

    date: (
      key: keyof T & string,
      header: string,
      dateFormat?: string,
      headerAr?: string
    ): ExportColumn<T> => ({
      key,
      header,
      headerAr,
      type: "date",
      dateFormat,
    }),

    boolean: (key: keyof T & string, header: string, headerAr?: string): ExportColumn<T> => ({
      key,
      header,
      headerAr,
      type: "boolean",
      align: "center",
    }),

    percentage: (key: keyof T & string, header: string, headerAr?: string): ExportColumn<T> => ({
      key,
      header,
      headerAr,
      type: "percentage",
      align: "right",
    }),

    custom: (
      key: string,
      header: string,
      accessor: (row: T) => unknown,
      headerAr?: string
    ): ExportColumn<T> => ({
      key,
      header,
      headerAr,
      accessor: accessor as ExportColumn<T>["accessor"],
    }),
  };
}
