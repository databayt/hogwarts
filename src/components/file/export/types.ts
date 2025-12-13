/**
 * Unified File Block - Export Types
 * Type definitions for export operations
 */

// ============================================================================
// Export Format Types
// ============================================================================

export type ExportFormat = "csv" | "excel" | "pdf" | "json";

export type ColumnAlignment = "left" | "center" | "right";

// ============================================================================
// Column Definition
// ============================================================================

export interface ExportColumn<T = unknown> {
  /** Unique key for the column */
  key: string;

  /** Column header text */
  header: string;

  /** Arabic header (for bilingual exports) */
  headerAr?: string;

  /** Width in pixels (for Excel/PDF) */
  width?: number;

  /** Minimum width */
  minWidth?: number;

  /** Text alignment */
  align?: ColumnAlignment;

  /** Data type for formatting */
  type?: "string" | "number" | "currency" | "date" | "boolean" | "percentage";

  /** Custom value accessor */
  accessor?: (row: T) => string | number | boolean | Date | null | undefined;

  /** Custom formatter for display */
  format?: (value: unknown, row: T, locale: string) => string;

  /** Currency code for currency type */
  currency?: string;

  /** Date format string */
  dateFormat?: string;

  /** Whether to include in CSV export */
  includeInCsv?: boolean;

  /** Whether to include in Excel export */
  includeInExcel?: boolean;

  /** Whether to include in PDF export */
  includeInPdf?: boolean;

  /** Whether column is hidden by default */
  hidden?: boolean;
}

// ============================================================================
// Export Configuration
// ============================================================================

export interface ExportConfig<T = unknown> {
  /** File name without extension */
  filename: string;

  /** Sheet name (for Excel) */
  sheetName?: string;

  /** Export columns */
  columns: ExportColumn<T>[];

  /** Data to export */
  data: T[];

  /** Formats to enable */
  formats?: ExportFormat[];

  /** Current locale */
  locale?: "en" | "ar";

  /** Include header row */
  includeHeader?: boolean;

  /** Include summary row at bottom */
  includeSummary?: boolean;

  /** Title for PDF header */
  title?: string;

  /** Subtitle for PDF header */
  subtitle?: string;

  /** Logo URL for PDF header */
  logoUrl?: string;

  /** School name for header */
  schoolName?: string;

  /** Generated date format */
  dateFormat?: string;

  /** PDF page orientation */
  orientation?: "portrait" | "landscape";

  /** PDF page size */
  pageSize?: "A4" | "Letter" | "Legal" | "A3";

  /** PDF margins */
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /** Custom styles for PDF */
  styles?: {
    headerBg?: string;
    headerText?: string;
    evenRowBg?: string;
    oddRowBg?: string;
    borderColor?: string;
  };

  /** Metadata to include in file */
  metadata?: Record<string, string>;
}

// ============================================================================
// Export Options
// ============================================================================

export interface ExportOptions {
  /** Selected format */
  format: ExportFormat;

  /** Include all columns or selected */
  selectedColumns?: string[];

  /** Filter to apply before export */
  filter?: Record<string, unknown>;

  /** Sort configuration */
  sort?: {
    key: string;
    direction: "asc" | "desc";
  };

  /** Maximum rows to export */
  maxRows?: number;

  /** Skip first N rows */
  offset?: number;

  /** Include row numbers */
  includeRowNumbers?: boolean;

  /** Date range filter */
  dateRange?: {
    start: Date;
    end: Date;
    column: string;
  };
}

// ============================================================================
// Export Result
// ============================================================================

export interface ExportResult {
  success: boolean;
  filename?: string;
  format?: ExportFormat;
  rowCount?: number;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
}

// ============================================================================
// Export Progress
// ============================================================================

export interface ExportProgress {
  status: "idle" | "preparing" | "generating" | "downloading" | "completed" | "error";
  progress: number;
  message?: string;
  error?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseExportReturn<T> {
  /** Export state */
  isExporting: boolean;
  progress: ExportProgress;
  error: string | null;

  /** Export actions */
  exportToCsv: (data?: T[], options?: Partial<ExportOptions>) => Promise<ExportResult>;
  exportToExcel: (data?: T[], options?: Partial<ExportOptions>) => Promise<ExportResult>;
  exportToPdf: (data?: T[], options?: Partial<ExportOptions>) => Promise<ExportResult>;
  exportToJson: (data?: T[], options?: Partial<ExportOptions>) => Promise<ExportResult>;
  exportTo: (format: ExportFormat, data?: T[], options?: Partial<ExportOptions>) => Promise<ExportResult>;

  /** Cancel export */
  cancel: () => void;

  /** Reset state */
  reset: () => void;
}

// ============================================================================
// Pre-built Column Helpers
// ============================================================================

export interface ColumnHelpers {
  text: <T>(key: keyof T & string, header: string, headerAr?: string) => ExportColumn<T>;
  number: <T>(key: keyof T & string, header: string, headerAr?: string) => ExportColumn<T>;
  currency: <T>(key: keyof T & string, header: string, currency?: string, headerAr?: string) => ExportColumn<T>;
  date: <T>(key: keyof T & string, header: string, format?: string, headerAr?: string) => ExportColumn<T>;
  boolean: <T>(key: keyof T & string, header: string, headerAr?: string) => ExportColumn<T>;
  percentage: <T>(key: keyof T & string, header: string, headerAr?: string) => ExportColumn<T>;
  custom: <T>(key: string, header: string, accessor: (row: T) => unknown, headerAr?: string) => ExportColumn<T>;
}
