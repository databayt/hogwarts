/**
 * Unified File Block - Print Types
 * Type definitions for print operations
 */

// ============================================================================
// Print Configuration Types
// ============================================================================

export type PageSize = "A4" | "A3" | "A5" | "Letter" | "Legal";
export type PageOrientation = "portrait" | "landscape";

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface PrintConfig {
  /** Page size */
  pageSize?: PageSize;

  /** Page orientation */
  orientation?: PageOrientation;

  /** Page margins in mm */
  margins?: PageMargins;

  /** Print in color or grayscale */
  color?: boolean;

  /** Include background graphics */
  printBackground?: boolean;

  /** Scale factor (0.1 to 2.0) */
  scale?: number;

  /** Header template (HTML) */
  headerTemplate?: string;

  /** Footer template (HTML) */
  footerTemplate?: string;

  /** Display header and footer */
  displayHeaderFooter?: boolean;

  /** Prefer CSS page size */
  preferCSSPageSize?: boolean;
}

// ============================================================================
// Print Result Types
// ============================================================================

export interface PrintResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Print Progress
// ============================================================================

export interface PrintProgress {
  status: "idle" | "preparing" | "printing" | "completed" | "error";
  message?: string;
  error?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UsePrintReturn {
  /** Print state */
  isPrinting: boolean;
  progress: PrintProgress;
  error: string | null;

  /** Actions */
  print: (element?: HTMLElement | null, config?: PrintConfig) => Promise<PrintResult>;
  printById: (elementId: string, config?: PrintConfig) => Promise<PrintResult>;
  printHtml: (html: string, config?: PrintConfig) => Promise<PrintResult>;

  /** Reset */
  reset: () => void;
}

// ============================================================================
// Pre-defined Page Formats
// ============================================================================

export const PAGE_SIZES: Record<PageSize, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A5: { width: 148, height: 210 },
  Letter: { width: 216, height: 279 },
  Legal: { width: 216, height: 356 },
};

export const DEFAULT_MARGINS: PageMargins = {
  top: 20,
  right: 20,
  bottom: 20,
  left: 20,
};
