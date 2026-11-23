// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Assignment Export Button
 * Uses unified File Block ExportButton for multi-format exports
 */

"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"

import { ExportButton as UnifiedExportButton } from "@/components/file"
import type { Locale } from "@/components/internationalization/config"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

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
    title?: string
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
  const fullDictionary = useDictionaryFallback<Record<string, any> | null>(null)
  const fetchFailed: string =
    fullDictionary?.assignments?.export?.fetchFailed ?? ""

  // Fetch data for export
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getAssignmentsExportData(filters)
      if (result.success && result.data) {
        setData(result.data as AssignmentExportData[])
      } else {
        setError(result.error ?? fetchFailed)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : fetchFailed)
    } finally {
      setIsLoading(false)
    }
  }, [filters, fetchFailed])

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
        title: dictionary?.title ?? "",
      }}
      data={data}
      formats={formats}
      variant={variant}
      size={size}
      label={label}
      showColumnSelector={showColumnSelector}
      disabled={isLoading || data.length === 0}
      dictionary={{
        export: dictionary?.export ?? "",
        exportAs: dictionary?.exportAs ?? "",
        csv: dictionary?.csv || "CSV",
        excel: dictionary?.excel ?? "",
        pdf: dictionary?.pdf || "PDF",
        exporting: dictionary?.exporting ?? "",
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
