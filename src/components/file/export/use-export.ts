/**
 * Unified File Block - Export Hook
 * Client-side hook for data export operations
 */

"use client"

import { useCallback, useRef, useState } from "react"

import { downloadBlob, exportToCsv } from "./csv-generator"
import { exportToExcel } from "./excel-generator"
import { generateExportFilename } from "./formatters"
import { exportToPdf } from "./pdf-generator"
import type {
  ExportColumn,
  ExportConfig,
  ExportFormat,
  ExportOptions,
  ExportProgress,
  ExportResult,
  UseExportReturn,
} from "./types"

// ============================================================================
// Hook Implementation
// ============================================================================

export function useExport<T>(
  config: Omit<ExportConfig<T>, "data">
): UseExportReturn<T> {
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress>({
    status: "idle",
    progress: 0,
  })
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  // ============================================================================
  // Export Functions
  // ============================================================================

  const exportToCsvFn = useCallback(
    async (
      data?: T[],
      options?: Partial<ExportOptions>
    ): Promise<ExportResult> => {
      setIsExporting(true)
      setError(null)
      setProgress({
        status: "preparing",
        progress: 10,
        message: "Preparing CSV export...",
      })

      try {
        const exportData = data || (config as ExportConfig<T>).data || []

        // Filter columns if specified
        let columns = config.columns
        if (options?.selectedColumns) {
          columns = columns.filter((col) =>
            options.selectedColumns!.includes(col.key)
          )
        }

        setProgress({
          status: "generating",
          progress: 50,
          message: "Generating CSV...",
        })

        const result = await exportToCsv({
          ...config,
          data: exportData,
          columns,
        })

        if (result.success) {
          setProgress({
            status: "completed",
            progress: 100,
            message: "Export complete",
          })
        } else {
          setProgress({ status: "error", progress: 0, error: result.error })
          setError(result.error || "Export failed")
        }

        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "CSV export failed"
        setProgress({ status: "error", progress: 0, error: errorMessage })
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsExporting(false)
      }
    },
    [config]
  )

  const exportToExcelFn = useCallback(
    async (
      data?: T[],
      options?: Partial<ExportOptions>
    ): Promise<ExportResult> => {
      setIsExporting(true)
      setError(null)
      setProgress({
        status: "preparing",
        progress: 10,
        message: "Preparing Excel export...",
      })

      try {
        const exportData = data || (config as ExportConfig<T>).data || []

        let columns = config.columns
        if (options?.selectedColumns) {
          columns = columns.filter((col) =>
            options.selectedColumns!.includes(col.key)
          )
        }

        setProgress({
          status: "generating",
          progress: 50,
          message: "Generating Excel...",
        })

        const result = await exportToExcel({
          ...config,
          data: exportData,
          columns,
        })

        if (result.success) {
          setProgress({
            status: "completed",
            progress: 100,
            message: "Export complete",
          })
        } else {
          setProgress({ status: "error", progress: 0, error: result.error })
          setError(result.error || "Export failed")
        }

        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Excel export failed"
        setProgress({ status: "error", progress: 0, error: errorMessage })
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsExporting(false)
      }
    },
    [config]
  )

  const exportToPdfFn = useCallback(
    async (
      data?: T[],
      options?: Partial<ExportOptions>
    ): Promise<ExportResult> => {
      setIsExporting(true)
      setError(null)
      setProgress({
        status: "preparing",
        progress: 10,
        message: "Preparing PDF export...",
      })

      try {
        const exportData = data || (config as ExportConfig<T>).data || []

        let columns = config.columns
        if (options?.selectedColumns) {
          columns = columns.filter((col) =>
            options.selectedColumns!.includes(col.key)
          )
        }

        setProgress({
          status: "generating",
          progress: 50,
          message: "Generating PDF...",
        })

        const result = await exportToPdf({
          ...config,
          data: exportData,
          columns,
        })

        if (result.success) {
          setProgress({
            status: "completed",
            progress: 100,
            message: "Export complete",
          })
        } else {
          setProgress({ status: "error", progress: 0, error: result.error })
          setError(result.error || "Export failed")
        }

        return result
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "PDF export failed"
        setProgress({ status: "error", progress: 0, error: errorMessage })
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsExporting(false)
      }
    },
    [config]
  )

  const exportToJsonFn = useCallback(
    async (
      data?: T[],
      options?: Partial<ExportOptions>
    ): Promise<ExportResult> => {
      setIsExporting(true)
      setError(null)
      setProgress({
        status: "preparing",
        progress: 10,
        message: "Preparing JSON export...",
      })

      try {
        const exportData = data || (config as ExportConfig<T>).data || []

        setProgress({
          status: "generating",
          progress: 50,
          message: "Generating JSON...",
        })

        // Generate JSON string
        const jsonString = JSON.stringify(exportData, null, 2)
        const blob = new Blob([jsonString], { type: "application/json" })
        const exportFilename = generateExportFilename(
          config.filename,
          "json",
          config.locale
        )

        setProgress({
          status: "downloading",
          progress: 80,
          message: "Downloading...",
        })

        downloadBlob(blob, exportFilename)

        setProgress({
          status: "completed",
          progress: 100,
          message: "Export complete",
        })

        return {
          success: true,
          filename: exportFilename,
          format: "json",
          rowCount: exportData.length,
          fileSize: blob.size,
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "JSON export failed"
        setProgress({ status: "error", progress: 0, error: errorMessage })
        setError(errorMessage)
        return { success: false, error: errorMessage }
      } finally {
        setIsExporting(false)
      }
    },
    [config]
  )

  const exportTo = useCallback(
    async (
      format: ExportFormat,
      data?: T[],
      options?: Partial<ExportOptions>
    ): Promise<ExportResult> => {
      switch (format) {
        case "csv":
          return exportToCsvFn(data, options)
        case "excel":
          return exportToExcelFn(data, options)
        case "pdf":
          return exportToPdfFn(data, options)
        case "json":
          return exportToJsonFn(data, options)
        default:
          return { success: false, error: `Unknown format: ${format}` }
      }
    },
    [exportToCsvFn, exportToExcelFn, exportToPdfFn, exportToJsonFn]
  )

  // ============================================================================
  // Control Functions
  // ============================================================================

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsExporting(false)
    setProgress({ status: "idle", progress: 0 })
  }, [])

  const reset = useCallback(() => {
    setIsExporting(false)
    setProgress({ status: "idle", progress: 0 })
    setError(null)
  }, [])

  return {
    isExporting,
    progress,
    error,
    exportToCsv: exportToCsvFn,
    exportToExcel: exportToExcelFn,
    exportToPdf: exportToPdfFn,
    exportToJson: exportToJsonFn,
    exportTo,
    cancel,
    reset,
  }
}

export type {
  ExportConfig,
  ExportColumn,
  ExportFormat,
  ExportOptions,
  ExportResult,
}
