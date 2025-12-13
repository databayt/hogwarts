/**
 * Unified File Block - CSV Generator
 * Generate and download CSV files
 */

import type { ExportColumn, ExportConfig, ExportResult } from "./types";
import { getValue, formatValue, getHeader, generateExportFilename } from "./formatters";

// ============================================================================
// CSV Generation
// ============================================================================

/**
 * Generate CSV content from data
 */
export function generateCsvContent<T>(
  data: T[],
  columns: ExportColumn<T>[],
  options: {
    locale?: string;
    includeHeader?: boolean;
    delimiter?: string;
    lineEnding?: string;
  } = {}
): string {
  const {
    locale = "en",
    includeHeader = true,
    delimiter = ",",
    lineEnding = "\n",
  } = options;

  // Filter columns that should be included in CSV
  const csvColumns = columns.filter(
    (col) => !col.hidden && col.includeInCsv !== false
  );

  const rows: string[] = [];

  // Add header row
  if (includeHeader) {
    const headerRow = csvColumns
      .map((col) => escapeCsvValue(getHeader(col, locale)))
      .join(delimiter);
    rows.push(headerRow);
  }

  // Add data rows
  for (const row of data) {
    const dataRow = csvColumns
      .map((col) => {
        const value = getValue(row, col);
        const formatted = formatValue(value, col, row, locale);
        return escapeCsvValue(formatted);
      })
      .join(delimiter);
    rows.push(dataRow);
  }

  // Add BOM for UTF-8 (helps Excel recognize encoding)
  const bom = "\ufeff";
  return bom + rows.join(lineEnding);
}

/**
 * Escape a value for CSV
 */
function escapeCsvValue(value: string): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // Check if escaping is needed
  const needsQuotes =
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r");

  if (needsQuotes) {
    // Escape double quotes by doubling them
    const escaped = stringValue.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return stringValue;
}

// ============================================================================
// CSV Export
// ============================================================================

/**
 * Generate and download CSV file
 */
export async function exportToCsv<T>(config: ExportConfig<T>): Promise<ExportResult> {
  try {
    const {
      filename,
      columns,
      data,
      locale = "en",
      includeHeader = true,
    } = config;

    // Generate CSV content
    const csvContent = generateCsvContent(data, columns, {
      locale,
      includeHeader,
    });

    // Create blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });

    // Generate filename
    const exportFilename = generateExportFilename(filename, "csv", locale);

    // Trigger download
    downloadBlob(blob, exportFilename);

    return {
      success: true,
      filename: exportFilename,
      format: "csv",
      rowCount: data.length,
      fileSize: blob.size,
    };
  } catch (error) {
    console.error("[exportToCsv] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "CSV export failed",
    };
  }
}

// ============================================================================
// Download Helper
// ============================================================================

/**
 * Trigger download of a blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ============================================================================
// CSV Parsing (for re-import validation)
// ============================================================================

/**
 * Parse CSV content into rows
 */
export function parseCsvContent(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  // Remove BOM if present
  const cleanContent = content.replace(/^\ufeff/, "");

  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    const nextChar = cleanContent[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        currentValue += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted value
        inQuotes = false;
      } else {
        currentValue += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted value
        inQuotes = true;
      } else if (char === ",") {
        // End of value
        currentRow.push(currentValue);
        currentValue = "";
      } else if (char === "\n" || (char === "\r" && nextChar === "\n")) {
        // End of row
        currentRow.push(currentValue);
        rows.push(currentRow);
        currentRow = [];
        currentValue = "";
        if (char === "\r") i++; // Skip \n after \r
      } else if (char !== "\r") {
        currentValue += char;
      }
    }
  }

  // Don't forget the last value
  if (currentValue || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}
