import * as XLSX from "xlsx"

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) {
    return headers.join(",")
  }

  // Create CSV header
  const csvHeader = headers.join(",")

  // Create CSV rows
  const csvRows = data
    .map((row) => {
      return headers
        .map((header) => {
          const keys = header.split(".")
          let value = row

          // Handle nested properties
          for (const key of keys) {
            value = value?.[key]
          }

          // Handle special values
          if (value === null || value === undefined) {
            return ""
          }

          // Handle dates
          if (value instanceof Date) {
            return value.toISOString()
          }

          // Handle arrays
          if (Array.isArray(value)) {
            return value.join("; ")
          }

          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value)
          const escaped = stringValue.replace(/"/g, '""')
          return escaped.includes(",") || escaped.includes("\n")
            ? `"${escaped}"`
            : escaped
        })
        .join(",")
    })
    .join("\n")

  return `${csvHeader}\n${csvRows}`
}

/**
 * Convert data to Excel format
 */
export function convertToExcel(
  data: any[],
  headers: string[],
  sheetName: string = "Sheet1"
): ArrayBuffer {
  if (!data || data.length === 0) {
    data = [{}]
  }

  // Prepare data with headers
  const worksheetData = [
    headers,
    ...data.map((row) => {
      return headers.map((header) => {
        const keys = header.split(".")
        let value = row

        // Handle nested properties
        for (const key of keys) {
          value = value?.[key]
        }

        // Handle special values
        if (value === null || value === undefined) {
          return ""
        }

        // Handle dates
        if (value instanceof Date) {
          return value.toLocaleDateString()
        }

        // Handle arrays
        if (Array.isArray(value)) {
          return value.join(", ")
        }

        return value
      })
    }),
  ]

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  // Auto-fit columns
  const maxWidth = 50
  const colWidths = headers.map((_, colIndex) => {
    const columnData = worksheetData.map((row) => String(row[colIndex] || ""))
    const maxLength = Math.max(...columnData.map((val) => val.length))
    return { wch: Math.min(maxLength + 2, maxWidth) }
  })
  ws["!cols"] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate Excel file
  const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  return excelBuffer
}

/**
 * Download file to client
 */
export function downloadFile(
  content: string | ArrayBuffer,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Format filename with timestamp
 */
export function formatFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
  return `${prefix}_${timestamp}.${extension}`
}

/**
 * Get localized headers from dictionary
 */
export function getLocalizedHeaders(
  columns: string[],
  dictionary: any,
  entityPath: string
): string[] {
  return columns.map((col) => {
    const path = `${entityPath}.${col}`
    const keys = path.split(".")
    let value = dictionary

    for (const key of keys) {
      value = value?.[key]
    }

    return value || col
  })
}

/**
 * Process data for export (handle relations, formatting)
 */
export function processDataForExport(
  data: any[],
  columns: string[],
  formatters?: Record<string, (value: any) => any>
): any[] {
  return data.map((row) => {
    const processedRow: any = {}

    columns.forEach((col) => {
      const keys = col.split(".")
      let value = row

      // Navigate nested properties
      for (const key of keys) {
        value = value?.[key]
      }

      // Apply formatter if available
      if (formatters?.[col]) {
        value = formatters[col](value)
      }

      processedRow[col] = value
    })

    return processedRow
  })
}
