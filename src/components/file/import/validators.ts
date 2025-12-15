/**
 * Unified File Block - Import Validators
 * Data validation utilities for imports
 */

import { z } from "zod"

import type {
  ImportColumn,
  ImportConfig,
  ImportResult,
  ImportRowError,
} from "./types"

// ============================================================================
// Value Parsers
// ============================================================================

/**
 * Parse string value based on column type
 */
export function parseValue(
  value: string,
  column: ImportColumn,
  row: Record<string, string>
): unknown {
  // Use custom parser if provided
  if (column.parser) {
    return column.parser(value, row)
  }

  // Handle empty values
  if (value === "" || value === null || value === undefined) {
    return column.defaultValue ?? null
  }

  // Parse based on type
  switch (column.type) {
    case "number": {
      const num = parseFloat(value.replace(/,/g, ""))
      return isNaN(num) ? null : num
    }

    case "boolean": {
      const lower = value.toLowerCase().trim()
      if (["true", "yes", "1", "نعم"].includes(lower)) return true
      if (["false", "no", "0", "لا"].includes(lower)) return false
      return null
    }

    case "date": {
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    }

    case "email": {
      return value.toLowerCase().trim()
    }

    case "phone": {
      // Remove non-numeric characters except +
      return value.replace(/[^\d+]/g, "")
    }

    case "string":
    default:
      return value.trim()
  }
}

// ============================================================================
// Value Validators
// ============================================================================

/**
 * Validate a single value
 */
export function validateValue(
  value: unknown,
  column: ImportColumn,
  row: Record<string, unknown>,
  rowIndex: number
): ImportRowError | null {
  // Check required
  if (
    column.required &&
    (value === null || value === undefined || value === "")
  ) {
    return {
      row: rowIndex,
      column: column.key,
      value,
      message: `${column.label} is required`,
      type: "required",
    }
  }

  // Skip validation if empty and not required
  if (value === null || value === undefined || value === "") {
    return null
  }

  // Custom validator
  if (column.validator) {
    const result = column.validator(value, row)
    if (result !== true) {
      return {
        row: rowIndex,
        column: column.key,
        value,
        message:
          typeof result === "string" ? result : `Invalid ${column.label}`,
        type: "validation",
      }
    }
  }

  // Zod schema validation
  if (column.schema) {
    const result = column.schema.safeParse(value)
    if (!result.success) {
      return {
        row: rowIndex,
        column: column.key,
        value,
        message: result.error.issues[0]?.message || `Invalid ${column.label}`,
        type: "validation",
      }
    }
  }

  // Type-specific validation
  switch (column.type) {
    case "email": {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(String(value))) {
        return {
          row: rowIndex,
          column: column.key,
          value,
          message: "Invalid email format",
          type: "validation",
        }
      }
      break
    }

    case "phone": {
      const phoneValue = String(value)
      if (phoneValue.length < 7 || phoneValue.length > 20) {
        return {
          row: rowIndex,
          column: column.key,
          value,
          message: "Invalid phone number format",
          type: "validation",
        }
      }
      break
    }

    case "number": {
      if (typeof value !== "number" || isNaN(value)) {
        return {
          row: rowIndex,
          column: column.key,
          value,
          message: "Invalid number format",
          type: "parsing",
        }
      }
      break
    }

    case "date": {
      if (!(value instanceof Date) || isNaN(value.getTime())) {
        return {
          row: rowIndex,
          column: column.key,
          value,
          message: "Invalid date format",
          type: "parsing",
        }
      }
      break
    }
  }

  return null
}

// ============================================================================
// Row Validation
// ============================================================================

/**
 * Parse and validate a single row
 */
export function processRow<T>(
  rawRow: Record<string, string>,
  columns: ImportColumn<T>[],
  rowIndex: number,
  config: ImportConfig<T>
): { data: Partial<T> | null; errors: ImportRowError[] } {
  const errors: ImportRowError[] = []
  const data: Record<string, unknown> = {}

  // Parse all columns
  for (const column of columns) {
    const rawValue = rawRow[column.header || column.key] ?? ""
    const parsedValue = parseValue(rawValue, column as ImportColumn, rawRow)

    // Apply transform if provided
    const finalValue = column.transform
      ? column.transform(parsedValue)
      : parsedValue

    data[column.key] = finalValue

    // Validate
    const error = validateValue(
      finalValue,
      column as ImportColumn,
      data,
      rowIndex
    )
    if (error) {
      errors.push(error)
      if (config.stopOnError) {
        return { data: null, errors }
      }
    }
  }

  // Full row schema validation
  if (config.rowSchema && errors.length === 0) {
    const result = config.rowSchema.safeParse(data)
    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({
          row: rowIndex,
          column: issue.path.join("."),
          message: issue.message,
          type: "validation",
        })
      }
      if (config.stopOnError) {
        return { data: null, errors }
      }
    }
  }

  return {
    data: errors.length === 0 ? (data as Partial<T>) : null,
    errors,
  }
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate all rows
 */
export function validateRows<T>(
  rows: Array<Record<string, string>>,
  columns: ImportColumn<T>[],
  config: ImportConfig<T>
): ImportResult<T> {
  const result: ImportResult<T> = {
    success: true,
    totalRows: rows.length,
    validRows: 0,
    invalidRows: 0,
    skippedRows: 0,
    data: [],
    errors: [],
    duplicates: 0,
    warnings: [],
  }

  const seenKeys = new Set<string>()
  let rowIndex = 0

  for (const rawRow of rows) {
    rowIndex++

    // Check max rows
    if (config.maxRows && rowIndex > config.maxRows) {
      result.warnings.push(`Stopped at row ${config.maxRows} (max rows limit)`)
      break
    }

    // Process row
    const { data, errors } = processRow(rawRow, columns, rowIndex, config)

    if (errors.length > 0) {
      result.errors.push(...errors)
      result.invalidRows++

      if (config.stopOnError) {
        result.success = false
        return result
      }
      continue
    }

    if (!data) {
      result.invalidRows++
      continue
    }

    // Check for duplicates
    if (config.uniqueKey && data[config.uniqueKey]) {
      const keyValue = String(data[config.uniqueKey])

      if (seenKeys.has(keyValue)) {
        result.duplicates++

        switch (config.duplicateHandling) {
          case "skip":
            result.skippedRows++
            continue

          case "error":
            result.errors.push({
              row: rowIndex,
              column: config.uniqueKey,
              value: keyValue,
              message: `Duplicate value: ${keyValue}`,
              type: "duplicate",
            })
            result.invalidRows++
            continue

          case "update":
            // Replace existing
            const existingIndex = result.data.findIndex(
              (d) =>
                (d as Record<string, unknown>)[config.uniqueKey!] === keyValue
            )
            if (existingIndex >= 0) {
              result.data[existingIndex] = data as T
            }
            continue

          default:
            // Allow duplicate
            break
        }
      }

      seenKeys.add(keyValue)
    }

    result.data.push(data as T)
    result.validRows++
  }

  result.success = result.errors.length === 0
  return result
}

// ============================================================================
// Common Validators
// ============================================================================

export const commonValidators = {
  required: (label: string) => (value: unknown) => {
    if (value === null || value === undefined || value === "") {
      return `${label} is required`
    }
    return true
  },

  email: (value: unknown) => {
    if (!value) return true
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(String(value)) || "Invalid email format"
  },

  phone: (value: unknown) => {
    if (!value) return true
    const phone = String(value).replace(/[^\d+]/g, "")
    return (phone.length >= 7 && phone.length <= 20) || "Invalid phone number"
  },

  minLength: (min: number, label: string) => (value: unknown) => {
    if (!value) return true
    return (
      String(value).length >= min ||
      `${label} must be at least ${min} characters`
    )
  },

  maxLength: (max: number, label: string) => (value: unknown) => {
    if (!value) return true
    return (
      String(value).length <= max ||
      `${label} must be at most ${max} characters`
    )
  },

  range: (min: number, max: number, label: string) => (value: unknown) => {
    if (value === null || value === undefined) return true
    const num = Number(value)
    return (
      (num >= min && num <= max) || `${label} must be between ${min} and ${max}`
    )
  },

  pattern: (regex: RegExp, message: string) => (value: unknown) => {
    if (!value) return true
    return regex.test(String(value)) || message
  },

  oneOf:
    <V>(values: V[], label: string) =>
    (value: unknown) => {
      if (!value) return true
      return (
        values.includes(value as V) ||
        `${label} must be one of: ${values.join(", ")}`
      )
    },
}

// ============================================================================
// Common Schemas
// ============================================================================

export const commonSchemas = {
  email: z.string().email("Invalid email format"),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^[\d+\-\s()]+$/, "Invalid phone format"),
  date: z.coerce.date(),
  positiveNumber: z.number().positive(),
  nonNegativeNumber: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
  uuid: z.string().uuid(),
  url: z.string().url(),
}
