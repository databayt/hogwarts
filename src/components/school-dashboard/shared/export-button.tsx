"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Legacy Export Button - DEPRECATED
 * This component is deprecated. Use ExportButton from @/components/file instead.
 *
 * @example
 * ```tsx
 * // New way (recommended)
 * import { ExportButton, type ExportColumn } from "@/components/file"
 *
 * const columns: ExportColumn<YourType>[] = [
 *   { key: "name", header: "Name", headerAr: "الاسم" },
 *   // ...
 * ]
 *
 * <ExportButton
 *   data={yourData}
 *   config={{ filename: "export", columns }}
 *   formats={["csv", "excel", "pdf"]}
 * />
 * ```
 *
 * @deprecated Use ExportButton from @/components/file instead
 */
import * as React from "react"
import { Download, FileSpreadsheet, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  downloadBlob,
  generateCsvContent,
  generateExportFilename,
} from "@/components/file"

export type ExportFormat = "csv" | "excel" | "pdf"

interface ExportButtonProps {
  /** Function to get CSV data */
  getCSV: (filters?: Record<string, unknown>) => Promise<string>
  /** Current filters to apply to export */
  filters?: Record<string, unknown>
  /** Entity name for filename (e.g., "students", "teachers") */
  entityName: string
  /** Available export formats */
  formats?: ExportFormat[]
  /** Button variant */
  variant?: "default" | "outline" | "ghost"
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
  /** i18n translations */
  translations?: {
    export?: string
    exportCSV?: string
    exportExcel?: string
    exportPDF?: string
    exporting?: string
  }
}

/**
 * @deprecated Use ExportButton from @/components/file instead
 */
export function ExportButton({
  getCSV,
  filters,
  entityName,
  formats = ["csv"],
  variant = "outline",
  size = "sm",
  translations = {},
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = React.useState(false)

  const t = {
    export: translations.export || "Export",
    exportCSV: translations.exportCSV || "Export CSV",
    exportExcel: translations.exportExcel || "Export Excel",
    exportPDF: translations.exportPDF || "Export PDF",
    exporting: translations.exporting || "Exporting...",
  }

  const handleExport = async (format: ExportFormat = "csv") => {
    setIsExporting(true)
    try {
      const csv = await getCSV(filters)
      if (!csv) return

      if (format === "csv") {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const filename = generateExportFilename(entityName, "csv")
        downloadBlob(blob, filename)
      } else if (format === "excel") {
        const XLSX = await import("xlsx")
        const lines = csv.split("\n").filter(Boolean)
        const data = lines.map((line) => {
          const values: string[] = []
          let current = ""
          let inQuotes = false
          for (const char of line) {
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === "," && !inQuotes) {
              values.push(current)
              current = ""
            } else {
              current += char
            }
          }
          values.push(current)
          return values
        })
        const ws = XLSX.utils.aoa_to_sheet(data)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Data")
        const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        })
        const filename = generateExportFilename(entityName, "xlsx")
        downloadBlob(blob, filename)
      } else if (format === "pdf") {
        // Build a simple HTML table for PDF printing
        const lines = csv.split("\n").filter(Boolean)
        const rows = lines.map((line) =>
          line.split(",").map((c) => c.replace(/^"|"$/g, ""))
        )
        const html = `
          <html><head><meta charset="utf-8"><style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: start; font-size: 12px; }
            th { background: #f5f5f5; font-weight: bold; }
            h2 { margin-bottom: 16px; }
          </style></head><body>
          <h2>${entityName}</h2>
          <table>${rows.map((row, i) => `<tr>${row.map((cell) => `<${i === 0 ? "th" : "td"}>${cell}</${i === 0 ? "th" : "td"}>`).join("")}</tr>`).join("")}</table>
          </body></html>`
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
          printWindow.print()
        }
      }
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Single format - show simple button
  if (formats.length === 1) {
    return (
      <Button
        onClick={() => handleExport(formats[0])}
        disabled={isExporting}
        variant={variant}
        size={size}
        aria-label={t.export}
        title={t.export}
      >
        {size === "icon" ? (
          <Download className="h-4 w-4" />
        ) : (
          <>
            <Download className="me-2 h-4 w-4" />
            {isExporting ? t.exporting : t.export}
          </>
        )}
      </Button>
    )
  }

  // Multiple formats - show dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          disabled={isExporting}
          variant={variant}
          size={size}
          aria-label={t.export}
          title={t.export}
        >
          {size === "icon" ? (
            <Download className="h-4 w-4" />
          ) : (
            <>
              <Download className="me-2 h-4 w-4" />
              {isExporting ? t.exporting : t.export}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.includes("csv") && (
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            <FileText className="me-2 h-4 w-4" />
            {t.exportCSV}
          </DropdownMenuItem>
        )}
        {formats.includes("excel") && (
          <DropdownMenuItem onClick={() => handleExport("excel")}>
            <FileSpreadsheet className="me-2 h-4 w-4" />
            {t.exportExcel}
          </DropdownMenuItem>
        )}
        {formats.includes("pdf") && (
          <DropdownMenuItem onClick={() => handleExport("pdf")}>
            <FileText className="me-2 h-4 w-4" />
            {t.exportPDF}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Re-export the new ExportButton from File module for migration
 */
export {
  ExportButton as NewExportButton,
  SimpleExportButton,
} from "@/components/file"
