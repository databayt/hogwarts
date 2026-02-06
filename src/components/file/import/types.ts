/**
 * Unified File Block - Import Types
 * Type definitions for import operations
 */

import { z } from "zod"

// ============================================================================
// Import Format Types
// ============================================================================

export type ImportFormat = "csv" | "excel" | "json"

// ============================================================================
// Column Mapping
// ============================================================================

export interface ImportColumn<T = unknown> {
  /** Target field key in the data model */
  key: keyof T & string

  /** Display label for the column */
  label: string

  /** Expected column header in file (exact match) */
  header?: string

  /** Alternative headers (for fuzzy matching) */
  alternativeHeaders?: string[]

  /** Whether this column is required */
  required?: boolean

  /** Data type for parsing */
  type?: "string" | "number" | "boolean" | "date" | "email" | "phone"

  /** Default value if missing */
  defaultValue?: unknown

  /** Zod schema for validation */
  schema?: z.ZodType

  /** Custom parser function */
  parser?: (value: string, row: Record<string, string>) => unknown

  /** Custom validator function */
  validator?: (value: unknown, row: Record<string, unknown>) => boolean | string

  /** Transform function after parsing */
  transform?: (value: unknown) => unknown
}

// ============================================================================
// Import Configuration
// ============================================================================

export interface ImportConfig<T = unknown> {
  /** Column definitions */
  columns: ImportColumn<T>[]

  /** Maximum rows to process */
  maxRows?: number

  /** Skip first N rows (for headers) */
  skipRows?: number

  /** Stop on first error or collect all */
  stopOnError?: boolean

  /** Unique key for duplicate detection */
  uniqueKey?: keyof T & string

  /** Handle duplicates: skip, update, or error */
  duplicateHandling?: "skip" | "update" | "error"

  /** Current locale */
  locale?: "en" | "ar"

  /** Batch size for processing */
  batchSize?: number

  /** Schema for full row validation */
  rowSchema?: z.ZodType<T>
}

// ============================================================================
// Import Result Types
// ============================================================================

export interface ImportRowError {
  row: number
  column?: string
  value?: unknown
  message: string
  type: "validation" | "parsing" | "duplicate" | "required"
}

export interface ImportResult<T = unknown> {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  skippedRows: number
  data: T[]
  errors: ImportRowError[]
  duplicates: number
  warnings: string[]
}

export interface ImportPreview<T = unknown> {
  headers: string[]
  mappedColumns: Array<{
    header: string
    mappedTo?: ImportColumn<T>
    autoMatched: boolean
  }>
  sampleRows: Array<Record<string, string>>
  totalRows: number
  format: ImportFormat
}

// ============================================================================
// Import Progress
// ============================================================================

export interface ImportProgress {
  status:
    | "idle"
    | "reading"
    | "parsing"
    | "validating"
    | "processing"
    | "completed"
    | "error"
  progress: number
  currentRow?: number
  totalRows?: number
  message?: string
  error?: string
}

// ============================================================================
// Import Options
// ============================================================================

export interface ImportOptions {
  /** Skip header row */
  skipHeader?: boolean

  /** Trim whitespace from values */
  trimValues?: boolean

  /** Convert empty strings to null */
  emptyToNull?: boolean

  /** Custom date format */
  dateFormat?: string

  /** Decimal separator for numbers */
  decimalSeparator?: "." | ","

  /** Sheet name/index for Excel */
  sheetName?: string | number

  /** Custom column mapping (header -> key) */
  columnMapping?: Record<string, string>
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseImportReturn<T> {
  /** Import state */
  isImporting: boolean
  progress: ImportProgress
  error: string | null
  preview: ImportPreview<T> | null
  result: ImportResult<T> | null

  /** Actions */
  parseFile: (file: File) => Promise<ImportPreview<T> | null>
  updateMapping: (header: string, column: ImportColumn<T> | null) => void
  validateData: () => Promise<ImportResult<T>>
  importData: (onSave: (data: T[]) => Promise<void>) => Promise<ImportResult<T>>

  /** Control */
  reset: () => void
  cancel: () => void
}
