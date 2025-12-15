/**
 * Unified File Block - Excel Generator
 * Generate and download Excel files using xlsx library
 */

import * as XLSX from "xlsx"

import { downloadBlob } from "./csv-generator"
import {
  formatValue,
  generateExportFilename,
  getHeader,
  getValue,
} from "./formatters"
import type { ExportColumn, ExportConfig, ExportResult } from "./types"

// ============================================================================
// Excel Generation
// ============================================================================

/**
 * Generate and download Excel file
 */
export async function exportToExcel<T>(
  config: ExportConfig<T>
): Promise<ExportResult> {
  try {
    const {
      filename,
      sheetName = "Data",
      columns,
      data,
      locale = "en",
      includeHeader = true,
      title,
      subtitle,
      schoolName,
      styles,
    } = config

    // Filter columns that should be included in Excel
    const excelColumns = columns.filter(
      (col) => !col.hidden && col.includeInExcel !== false
    )

    // Build worksheet data
    const wsData: unknown[][] = []

    // Add title rows if provided
    if (title || schoolName) {
      if (schoolName) {
        wsData.push([schoolName])
        wsData.push([]) // Empty row
      }
      if (title) {
        wsData.push([title])
      }
      if (subtitle) {
        wsData.push([subtitle])
      }
      wsData.push([]) // Empty row before data
    }

    // Add header row
    if (includeHeader) {
      const headers = excelColumns.map((col) => getHeader(col, locale))
      wsData.push(headers)
    }

    // Add data rows
    for (const row of data) {
      const rowData = excelColumns.map((col) => {
        const value = getValue(row, col)

        // For Excel, we want to keep raw values for numbers/dates when possible
        if (
          col.type === "number" ||
          col.type === "currency" ||
          col.type === "percentage"
        ) {
          const numValue =
            typeof value === "number" ? value : parseFloat(String(value))
          if (!isNaN(numValue)) return numValue
        }

        if (col.type === "date" && value) {
          const dateValue =
            value instanceof Date ? value : new Date(String(value))
          if (!isNaN(dateValue.getTime())) return dateValue
        }

        // Otherwise use formatted string
        return formatValue(value, col, row, locale)
      })
      wsData.push(rowData)
    }

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Apply column widths
    const colWidths = excelColumns.map((col) => ({
      wch: col.width ? Math.round(col.width / 7) : 15, // Convert pixels to characters
    }))
    ws["!cols"] = colWidths

    // Apply basic styling (xlsx-js-style required for advanced styling)
    const headerRowIndex =
      title || schoolName ? wsData.length - data.length - 1 : 0
    applyBasicStyles(ws, headerRowIndex, excelColumns.length, styles)

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    })

    // Create blob
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    // Generate filename
    const exportFilename = generateExportFilename(filename, "xlsx", locale)

    // Trigger download
    downloadBlob(blob, exportFilename)

    return {
      success: true,
      filename: exportFilename,
      format: "excel",
      rowCount: data.length,
      fileSize: blob.size,
    }
  } catch (error) {
    console.error("[exportToExcel] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Excel export failed",
    }
  }
}

/**
 * Apply basic styles to worksheet (limited without xlsx-js-style)
 */
function applyBasicStyles(
  ws: XLSX.WorkSheet,
  headerRow: number,
  columnCount: number,
  styles?: ExportConfig["styles"]
): void {
  // xlsx library has limited styling without xlsx-js-style
  // Set row heights
  if (!ws["!rows"]) ws["!rows"] = []
  ws["!rows"][headerRow] = { hpt: 20 } // Header row height

  // Freeze header row
  ws["!freeze"] = { xSplit: 0, ySplit: headerRow + 1 }

  // AutoFilter for header row
  const lastCol = XLSX.utils.encode_col(columnCount - 1)
  const lastRow = ws["!ref"]?.split(":")[1]?.match(/\d+/)?.[0] || "1"
  ws["!autofilter"] = {
    ref: `A${headerRow + 1}:${lastCol}${lastRow}`,
  }
}

// ============================================================================
// Multi-Sheet Excel
// ============================================================================

interface SheetData<T> {
  name: string
  data: T[]
  columns: ExportColumn<T>[]
}

/**
 * Generate Excel with multiple sheets
 */
export async function exportToExcelMultiSheet<T>(
  sheets: SheetData<T>[],
  filename: string,
  options: {
    locale?: string
    includeHeader?: boolean
  } = {}
): Promise<ExportResult> {
  try {
    const { locale = "en", includeHeader = true } = options

    const wb = XLSX.utils.book_new()

    for (const sheet of sheets) {
      // Filter columns
      const excelColumns = sheet.columns.filter(
        (col) => !col.hidden && col.includeInExcel !== false
      )

      // Build worksheet data
      const wsData: unknown[][] = []

      // Add header row
      if (includeHeader) {
        const headers = excelColumns.map((col) => getHeader(col, locale))
        wsData.push(headers)
      }

      // Add data rows
      for (const row of sheet.data) {
        const rowData = excelColumns.map((col) => {
          const value = getValue(row, col)
          return formatValue(value, col, row, locale)
        })
        wsData.push(rowData)
      }

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Apply column widths
      ws["!cols"] = excelColumns.map((col) => ({
        wch: col.width ? Math.round(col.width / 7) : 15,
      }))

      // Add to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)) // Excel sheet name limit
    }

    // Generate file
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    })

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    const exportFilename = generateExportFilename(filename, "xlsx", locale)
    downloadBlob(blob, exportFilename)

    const totalRows = sheets.reduce((sum, s) => sum + s.data.length, 0)

    return {
      success: true,
      filename: exportFilename,
      format: "excel",
      rowCount: totalRows,
      fileSize: blob.size,
    }
  } catch (error) {
    console.error("[exportToExcelMultiSheet] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Multi-sheet Excel export failed",
    }
  }
}

// ============================================================================
// Excel Template Support
// ============================================================================

/**
 * Generate Excel from template (loads template and populates data)
 */
export async function exportFromTemplate<T>(
  templateUrl: string,
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  options: {
    sheetName?: string
    startRow?: number
    startCol?: number
    locale?: string
  } = {}
): Promise<ExportResult> {
  try {
    const {
      sheetName = "Data",
      startRow = 1,
      startCol = 0,
      locale = "en",
    } = options

    // Fetch template
    const response = await fetch(templateUrl)
    const templateBuffer = await response.arrayBuffer()

    // Load workbook
    const wb = XLSX.read(templateBuffer, { type: "array" })

    // Get or create sheet
    let ws = wb.Sheets[sheetName]
    if (!ws) {
      ws = XLSX.utils.aoa_to_sheet([])
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    }

    // Filter columns
    const excelColumns = columns.filter(
      (col) => !col.hidden && col.includeInExcel !== false
    )

    // Write data starting at specified position
    for (let rowIdx = 0; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx]
      for (let colIdx = 0; colIdx < excelColumns.length; colIdx++) {
        const col = excelColumns[colIdx]
        const value = getValue(row, col)
        const formatted = formatValue(value, col, row, locale)

        const cellRef = XLSX.utils.encode_cell({
          r: startRow + rowIdx,
          c: startCol + colIdx,
        })

        ws[cellRef] = { v: formatted, t: "s" }
      }
    }

    // Update sheet range
    const lastRow = startRow + data.length - 1
    const lastCol = startCol + excelColumns.length - 1
    ws["!ref"] = `A1:${XLSX.utils.encode_col(lastCol)}${lastRow + 1}`

    // Generate file
    const excelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "array",
    })

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    const exportFilename = generateExportFilename(filename, "xlsx", locale)
    downloadBlob(blob, exportFilename)

    return {
      success: true,
      filename: exportFilename,
      format: "excel",
      rowCount: data.length,
      fileSize: blob.size,
    }
  } catch (error) {
    console.error("[exportFromTemplate] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Template export failed",
    }
  }
}
