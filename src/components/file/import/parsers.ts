/**
 * Unified File Block - Import Parsers
 * File parsing utilities for different formats
 */

import * as XLSX from "xlsx";
import { parseCsvContent } from "../export/csv-generator";
import type { ImportFormat, ImportOptions, ImportPreview, ImportColumn } from "./types";

// ============================================================================
// Format Detection
// ============================================================================

/**
 * Detect import format from file
 */
export function detectFormat(file: File): ImportFormat | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const mimeType = file.type;

  if (
    extension === "csv" ||
    mimeType === "text/csv" ||
    mimeType === "application/csv"
  ) {
    return "csv";
  }

  if (
    extension === "xlsx" ||
    extension === "xls" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel"
  ) {
    return "excel";
  }

  if (
    extension === "json" ||
    mimeType === "application/json"
  ) {
    return "json";
  }

  return null;
}

// ============================================================================
// CSV Parser
// ============================================================================

/**
 * Parse CSV file content
 */
export async function parseCsvFile(
  file: File,
  options: ImportOptions = {}
): Promise<{ headers: string[]; rows: string[][]; totalRows: number }> {
  const content = await file.text();
  const rows = parseCsvContent(content);

  if (rows.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // Extract headers
  const headers = options.skipHeader !== false ? rows[0] : [];
  const dataRows = options.skipHeader !== false ? rows.slice(1) : rows;

  // Trim values if requested
  const processedRows = options.trimValues !== false
    ? dataRows.map((row) => row.map((cell) => cell.trim()))
    : dataRows;

  return {
    headers: headers.map((h) => h.trim()),
    rows: processedRows,
    totalRows: processedRows.length,
  };
}

// ============================================================================
// Excel Parser
// ============================================================================

/**
 * Parse Excel file content
 */
export async function parseExcelFile(
  file: File,
  options: ImportOptions = {}
): Promise<{ headers: string[]; rows: string[][]; totalRows: number; sheets: string[] }> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  // Get available sheets
  const sheets = workbook.SheetNames;

  // Select sheet
  const sheetName = options.sheetName !== undefined
    ? typeof options.sheetName === "number"
      ? sheets[options.sheetName]
      : options.sheetName
    : sheets[0];

  if (!sheetName || !workbook.Sheets[sheetName]) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  const worksheet = workbook.Sheets[sheetName];

  // Convert to array of arrays
  const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
    header: 1,
    raw: false, // Convert dates to strings
    defval: "",
  });

  if (rawData.length === 0) {
    return { headers: [], rows: [], totalRows: 0, sheets };
  }

  // Extract headers
  const headers = options.skipHeader !== false
    ? (rawData[0] || []).map((h) => String(h).trim())
    : [];

  const dataRows = options.skipHeader !== false ? rawData.slice(1) : rawData;

  // Process rows
  const processedRows = dataRows.map((row) =>
    row.map((cell) => {
      const value = cell !== null && cell !== undefined ? String(cell) : "";
      return options.trimValues !== false ? value.trim() : value;
    })
  );

  return {
    headers,
    rows: processedRows,
    totalRows: processedRows.length,
    sheets,
  };
}

// ============================================================================
// JSON Parser
// ============================================================================

/**
 * Parse JSON file content
 */
export async function parseJsonFile(
  file: File
): Promise<{ headers: string[]; rows: Array<Record<string, unknown>>; totalRows: number }> {
  const content = await file.text();
  const data = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error("JSON file must contain an array of objects");
  }

  if (data.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // Extract headers from first object
  const headers = Object.keys(data[0]);

  return {
    headers,
    rows: data,
    totalRows: data.length,
  };
}

// ============================================================================
// Unified Parser
// ============================================================================

/**
 * Parse any supported file format
 */
export async function parseFile(
  file: File,
  options: ImportOptions = {}
): Promise<{
  format: ImportFormat;
  headers: string[];
  rows: Array<Record<string, string>>;
  totalRows: number;
  sheets?: string[];
}> {
  const format = detectFormat(file);

  if (!format) {
    throw new Error(`Unsupported file format: ${file.name}`);
  }

  switch (format) {
    case "csv": {
      const result = await parseCsvFile(file, options);
      const rows = result.rows.map((row) => {
        const obj: Record<string, string> = {};
        result.headers.forEach((header, idx) => {
          obj[header] = row[idx] || "";
        });
        return obj;
      });
      return { format, headers: result.headers, rows, totalRows: result.totalRows };
    }

    case "excel": {
      const result = await parseExcelFile(file, options);
      const rows = result.rows.map((row) => {
        const obj: Record<string, string> = {};
        result.headers.forEach((header, idx) => {
          obj[header] = row[idx] || "";
        });
        return obj;
      });
      return { format, headers: result.headers, rows, totalRows: result.totalRows, sheets: result.sheets };
    }

    case "json": {
      const result = await parseJsonFile(file);
      const rows = result.rows.map((row) => {
        const obj: Record<string, string> = {};
        result.headers.forEach((header) => {
          const value = row[header];
          obj[header] = value !== null && value !== undefined ? String(value) : "";
        });
        return obj;
      });
      return { format, headers: result.headers, rows, totalRows: result.totalRows };
    }

    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

// ============================================================================
// Column Matching
// ============================================================================

/**
 * Auto-match file headers to import columns
 */
export function autoMatchColumns<T>(
  headers: string[],
  columns: ImportColumn<T>[]
): Array<{ header: string; mappedTo?: ImportColumn<T>; autoMatched: boolean }> {
  return headers.map((header) => {
    const normalizedHeader = header.toLowerCase().trim();

    // Try exact match on header
    let matched = columns.find(
      (col) => col.header?.toLowerCase() === normalizedHeader
    );

    // Try exact match on key
    if (!matched) {
      matched = columns.find(
        (col) => col.key.toLowerCase() === normalizedHeader
      );
    }

    // Try alternative headers
    if (!matched) {
      matched = columns.find((col) =>
        col.alternativeHeaders?.some(
          (alt) => alt.toLowerCase() === normalizedHeader
        )
      );
    }

    // Try fuzzy match on label
    if (!matched) {
      matched = columns.find(
        (col) =>
          col.label.toLowerCase().includes(normalizedHeader) ||
          normalizedHeader.includes(col.label.toLowerCase())
      );
    }

    return {
      header,
      mappedTo: matched,
      autoMatched: !!matched,
    };
  });
}

// ============================================================================
// Preview Generation
// ============================================================================

/**
 * Generate import preview from file
 */
export async function generatePreview<T>(
  file: File,
  columns: ImportColumn<T>[],
  options: ImportOptions = {},
  previewRows: number = 5
): Promise<ImportPreview<T>> {
  const { format, headers, rows, totalRows } = await parseFile(file, options);

  const mappedColumns = autoMatchColumns(headers, columns);
  const sampleRows = rows.slice(0, previewRows);

  return {
    headers,
    mappedColumns,
    sampleRows,
    totalRows,
    format,
  };
}
