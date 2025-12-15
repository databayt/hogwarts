/**
 * useImport Hook - CSV/Excel Import with Column Mapping & Validation
 *
 * Manages multi-step file import workflow:
 * 1. PARSE: Read file, auto-detect columns, show sample data
 * 2. MAP: User selects which file columns map to schema fields
 * 3. VALIDATE: Check data types, required fields, detect duplicates
 * 4. IMPORT: Batch insert via onSave callback (50 rows at a time)
 *
 * KEY PATTERNS:
 * - AUTO-MATCHING: Uses column name heuristics to suggest mappings
 * - PROGRESS TRACKING: Multi-stage progress from parse → validate → import
 * - BATCH PROCESSING: Imports in 50-row batches to avoid request size limits
 * - STORED REFS: Uses useRef for large data (parsed rows, column mapping)
 * - ERROR COLLECTION: Tracks per-row errors instead of failing on first error
 *
 * GOTCHAS:
 * - parseFile assumes CSV/Excel format (must support XLS/XLSX separately)
 * - Column mapping stored in Ref - resets on reset() call
 * - Required columns validation blocks import (all must be mapped)
 * - Validation errors are per-row; import still continues if errors exist
 */

"use client"

import { useCallback, useRef, useState } from "react"

import { autoMatchColumns, parseFile } from "./parsers"
import type {
  ImportColumn,
  ImportConfig,
  ImportOptions,
  ImportPreview,
  ImportProgress,
  ImportResult,
  UseImportReturn,
} from "./types"
import { validateRows } from "./validators"

// ============================================================================
// Hook Implementation
// ============================================================================

export function useImport<T>(config: ImportConfig<T>): UseImportReturn<T> {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<ImportProgress>({
    status: "idle",
    progress: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ImportPreview<T> | null>(null)
  const [result, setResult] = useState<ImportResult<T> | null>(null)

  // Store parsed data for validation/import - large data stored in Ref to avoid re-renders
  // Raw rows from file parser: [{"name": "John", "email": "john@example.com"}, ...]
  const parsedDataRef = useRef<Array<Record<string, string>>>([])
  // Maps file columns to schema columns: {"name" → ImportColumn, "email" → ImportColumn}
  // Null means unmapped column (ignored during import)
  const columnMappingRef = useRef<Map<string, ImportColumn<T> | null>>(
    new Map()
  )

  // ============================================================================
  // Parse File
  // ============================================================================

  const parseFileFn = useCallback(
    async (file: File): Promise<ImportPreview<T> | null> => {
      setIsImporting(true)
      setError(null)
      setResult(null)
      setProgress({
        status: "reading",
        progress: 10,
        message: "Reading file...",
      })

      try {
        // Parse file
        const { format, headers, rows, totalRows } = await parseFile(file)

        setProgress({
          status: "parsing",
          progress: 50,
          message: "Parsing data...",
        })

        // Store parsed data
        parsedDataRef.current = rows

        // Auto-match columns
        const mappedColumns = autoMatchColumns(headers, config.columns)

        // Update column mapping
        columnMappingRef.current = new Map(
          mappedColumns.map((mc) => [mc.header, mc.mappedTo || null])
        )

        // Get sample rows
        const sampleRows = rows.slice(0, 5)

        const previewData: ImportPreview<T> = {
          headers,
          mappedColumns,
          sampleRows,
          totalRows,
          format,
        }

        setPreview(previewData)
        setProgress({
          status: "idle",
          progress: 100,
          message: "File parsed successfully",
        })

        return previewData
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to parse file"
        setError(errorMessage)
        setProgress({ status: "error", progress: 0, error: errorMessage })
        return null
      } finally {
        setIsImporting(false)
      }
    },
    [config.columns]
  )

  // ============================================================================
  // Update Column Mapping
  // ============================================================================

  const updateMapping = useCallback(
    (header: string, column: ImportColumn<T> | null) => {
      columnMappingRef.current.set(header, column)

      // Update preview
      if (preview) {
        setPreview({
          ...preview,
          mappedColumns: preview.mappedColumns.map((mc) =>
            mc.header === header
              ? { ...mc, mappedTo: column || undefined, autoMatched: false }
              : mc
          ),
        })
      }
    },
    [preview]
  )

  // ============================================================================
  // Validate Data
  // ============================================================================

  const validateData = useCallback(async (): Promise<ImportResult<T>> => {
    setIsImporting(true)
    setError(null)
    setProgress({
      status: "validating",
      progress: 30,
      message: "Validating data...",
    })

    try {
      const rows = parsedDataRef.current

      if (rows.length === 0) {
        const emptyResult: ImportResult<T> = {
          success: false,
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          skippedRows: 0,
          data: [],
          errors: [
            { row: 0, message: "No data to import", type: "validation" },
          ],
          duplicates: 0,
          warnings: [],
        }
        setResult(emptyResult)
        return emptyResult
      }

      // Build column list from mapping
      const mappedColumns: ImportColumn<T>[] = []
      columnMappingRef.current.forEach((column, header) => {
        if (column) {
          mappedColumns.push({ ...column, header })
        }
      })

      // Check required columns
      const missingRequired = config.columns
        .filter((col) => col.required)
        .filter((col) => !mappedColumns.find((mc) => mc.key === col.key))

      if (missingRequired.length > 0) {
        const errorResult: ImportResult<T> = {
          success: false,
          totalRows: rows.length,
          validRows: 0,
          invalidRows: rows.length,
          skippedRows: 0,
          data: [],
          errors: missingRequired.map((col) => ({
            row: 0,
            column: col.key,
            message: `Required column "${col.label}" is not mapped`,
            type: "required" as const,
          })),
          duplicates: 0,
          warnings: [],
        }
        setResult(errorResult)
        return errorResult
      }

      // Validate rows
      setProgress({
        status: "validating",
        progress: 50,
        message: `Validating ${rows.length} rows...`,
        totalRows: rows.length,
      })

      const validationResult = validateRows(rows, mappedColumns, config)

      setResult(validationResult)
      setProgress({
        status: validationResult.success ? "completed" : "error",
        progress: 100,
        message: validationResult.success
          ? `Validated ${validationResult.validRows} rows`
          : `${validationResult.errors.length} validation errors`,
      })

      return validationResult
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Validation failed"
      setError(errorMessage)
      setProgress({ status: "error", progress: 0, error: errorMessage })

      const errorResult: ImportResult<T> = {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        skippedRows: 0,
        data: [],
        errors: [{ row: 0, message: errorMessage, type: "validation" }],
        duplicates: 0,
        warnings: [],
      }
      return errorResult
    } finally {
      setIsImporting(false)
    }
  }, [config])

  // ============================================================================
  // Import Data
  // ============================================================================

  const importData = useCallback(
    async (onSave: (data: T[]) => Promise<void>): Promise<ImportResult<T>> => {
      setIsImporting(true)
      setError(null)
      setProgress({
        status: "processing",
        progress: 10,
        message: "Starting import...",
      })

      try {
        // Validate first if not already validated
        let importResult = result
        if (!importResult || importResult.data.length === 0) {
          importResult = await validateData()
        }

        if (!importResult.success || importResult.data.length === 0) {
          setProgress({
            status: "error",
            progress: 0,
            error: "No valid data to import",
          })
          return importResult
        }

        // Process in batches - prevents request timeout and reduces memory pressure
        // Default 50 rows/batch chosen to stay well below typical request size limits (1MB+)
        const batchSize = config.batchSize || 50
        const totalBatches = Math.ceil(importResult.data.length / batchSize)

        for (let i = 0; i < totalBatches; i++) {
          const start = i * batchSize
          const end = Math.min(start + batchSize, importResult.data.length)
          const batch = importResult.data.slice(start, end)

          setProgress({
            status: "processing",
            progress: 20 + Math.floor((i / totalBatches) * 70), // Spreads 20-90% across batches
            message: `Importing batch ${i + 1} of ${totalBatches}...`,
            currentRow: end,
            totalRows: importResult.data.length,
          })

          // onSave is parent's server action - responsible for database insert and deduplication
          await onSave(batch)
        }

        setProgress({
          status: "completed",
          progress: 100,
          message: `Successfully imported ${importResult.validRows} records`,
        })

        return importResult
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Import failed"
        setError(errorMessage)
        setProgress({ status: "error", progress: 0, error: errorMessage })

        return {
          success: false,
          totalRows: result?.totalRows || 0,
          validRows: 0,
          invalidRows: result?.totalRows || 0,
          skippedRows: 0,
          data: [],
          errors: [{ row: 0, message: errorMessage, type: "validation" }],
          duplicates: 0,
          warnings: [],
        }
      } finally {
        setIsImporting(false)
      }
    },
    [config.batchSize, result, validateData]
  )

  // ============================================================================
  // Control Functions
  // ============================================================================

  const reset = useCallback(() => {
    setIsImporting(false)
    setProgress({ status: "idle", progress: 0 })
    setError(null)
    setPreview(null)
    setResult(null)
    parsedDataRef.current = []
    columnMappingRef.current.clear()
  }, [])

  const cancel = useCallback(() => {
    setIsImporting(false)
    setProgress({ status: "idle", progress: 0 })
  }, [])

  return {
    isImporting,
    progress,
    error,
    preview,
    result,
    parseFile: parseFileFn,
    updateMapping,
    validateData,
    importData,
    reset,
    cancel,
  }
}
