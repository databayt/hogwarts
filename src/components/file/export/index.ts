// Import for internal use in legacy functions
import { downloadBlob as _downloadBlob } from "./csv-generator"

/**
 * Unified File Block - Export Module Exports
 */

// Types
export type {
  ExportFormat,
  ColumnAlignment,
  ExportColumn,
  ExportConfig,
  ExportOptions,
  ExportResult,
  ExportProgress,
  UseExportReturn,
  ColumnHelpers,
} from "./types"

// Formatters
export {
  formatValue,
  formatNumber,
  formatCurrency,
  formatDate,
  formatBoolean,
  formatPercentage,
  getValue,
  processRow,
  processRows,
  getHeader,
  getHeaders,
  sanitizeFilename,
  generateExportFilename,
  createColumnHelpers,
} from "./formatters"

// CSV Generator
export {
  generateCsvContent,
  exportToCsv,
  downloadBlob,
  parseCsvContent,
} from "./csv-generator"

// Excel Generator
export {
  exportToExcel,
  exportToExcelMultiSheet,
  exportFromTemplate,
} from "./excel-generator"

// PDF Generator
export {
  exportToPdf,
  PDFPreview,
  createStyles as createPdfStyles,
} from "./pdf-generator"

// Hook
export { useExport } from "./use-export"

// Components
export {
  ExportButton,
  SimpleExportButton,
  type ExportButtonProps,
  type SimpleExportButtonProps,
} from "./export-button"

// ============================================================================
// Legacy Functions (backward compatibility)
// ============================================================================

/**
 * Convert array of objects to CSV string
 * @deprecated Use generateCsvContent instead
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  options?: {
    columns?: Array<{ key: keyof T | string; label: string }>
    includeHeaders?: boolean
    delimiter?: string
  }
): string {
  const { columns, includeHeaders = true, delimiter = "," } = options || {}

  if (data.length === 0) return ""

  const cols =
    columns || Object.keys(data[0]).map((key) => ({ key, label: key }))
  const rows: string[] = []

  if (includeHeaders) {
    const headerRow = cols
      .map((col) => escapeCSVValue(col.label))
      .join(delimiter)
    rows.push(headerRow)
  }

  for (const item of data) {
    const row = cols
      .map((col) => {
        const value = item[col.key as keyof T]
        return escapeCSVValue(formatCsvValue(value))
      })
      .join(delimiter)
    rows.push(row)
  }

  return rows.join("\n")
}

function escapeCSVValue(value: string): string {
  const stringValue = String(value || "")
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (value instanceof Date) return value.toISOString().split("T")[0]
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (typeof value === "object") return JSON.stringify(value)
  return String(value)
}

/**
 * Generate filename with timestamp
 * @deprecated Use generateExportFilename instead
 */
export function generateCSVFilename(
  prefix: string,
  options?: { timestamp?: boolean; extension?: string }
): string {
  const { timestamp = true, extension = "csv" } = options || {}
  let filename = prefix

  if (timestamp) {
    const now = new Date()
    const dateStr = now.toISOString().split("T")[0]
    const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-")
    filename += `_${dateStr}_${timeStr}`
  }

  return `${filename}.${extension}`
}

/**
 * Create CSV download from data
 * @deprecated Use downloadBlob with generateCsvContent instead
 */
export function downloadCSV(
  data: Record<string, unknown>[],
  filename: string,
  columns?: Array<{ key: string; label: string }>
): void {
  const csv = arrayToCSV(data, { columns })
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  _downloadBlob(blob, filename)
}
