/**
 * Assignment Export Button
 * Uses unified File Block ExportButton for multi-format exports
 */

"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"

import { ExportButton as UnifiedExportButton } from "@/components/file"
import type { Locale } from "@/components/internationalization/config"

import { getAssignmentsExportData } from "./actions"
import {
  ASSIGNMENT_EXPORT_COLUMNS,
  type AssignmentExportData,
} from "./columns/export"

// ============================================================================
// Types
// ============================================================================

interface ExportButtonProps {
  /** Optional filters to apply to export data */
  filters?: {
    title?: string
    type?: string
    classId?: string
  }
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary"
  /** Button size */
  size?: "default" | "sm" | "lg"
  /** Current locale for i18n */
  locale?: Locale
  /** Custom label */
  label?: string
  /** Export formats to enable */
  formats?: ("csv" | "excel" | "pdf")[]
  /** Show column selector dialog */
  showColumnSelector?: boolean
  /** Dictionary for translations */
  dictionary?: {
    export?: string
    exportAs?: string
    csv?: string
    excel?: string
    pdf?: string
    exporting?: string
  }
}

// ============================================================================
// Component
// ============================================================================

export function ExportButton({
  filters,
  variant = "outline",
  size = "sm",
  locale = "en",
  label,
  formats = ["csv", "excel", "pdf"],
  showColumnSelector = false,
  dictionary,
}: ExportButtonProps) {
  const [data, setData] = useState<AssignmentExportData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch data for export
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getAssignmentsExportData(filters)
      if (result.success && result.data) {
        setData(result.data as AssignmentExportData[])
      } else {
        setError("error" in result ? result.error : "Failed to fetch data")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <UnifiedExportButton
      config={{
        filename: "assignments",
        columns: ASSIGNMENT_EXPORT_COLUMNS,
        locale,
        title:
          dictionary?.export ||
          (locale === "ar" ? "قائمة الواجبات" : "Assignment List"),
      }}
      data={data}
      formats={formats}
      variant={variant}
      size={size}
      label={label}
      showColumnSelector={showColumnSelector}
      disabled={isLoading || data.length === 0}
      dictionary={{
        export: dictionary?.export || (locale === "ar" ? "تصدير" : "Export"),
        exportAs:
          dictionary?.exportAs || (locale === "ar" ? "تصدير كـ" : "Export as"),
        csv: dictionary?.csv || "CSV",
        excel: dictionary?.excel || "Excel",
        pdf: dictionary?.pdf || "PDF",
        exporting:
          dictionary?.exporting ||
          (locale === "ar" ? "جاري التصدير..." : "Exporting..."),
      }}
      onExportError={(err) => {
        console.error("Export failed:", err)
      }}
    />
  )
}

// ============================================================================
// Re-export for backwards compatibility
// ============================================================================

export { ExportButton as AssignmentExportButton }
