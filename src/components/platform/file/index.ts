/**
 * Unified File Block
 * Centralized file operations: upload, download, export, import, print, generate
 *
 * @example
 * ```tsx
 * import { ExportButton, FileUploader, useUpload } from "@/components/platform/file"
 *
 * // Upload files
 * <FileUploader
 *   folder="documents"
 *   category="document"
 *   onUpload={(urls) => console.log(urls)}
 * />
 *
 * // Export data
 * <ExportButton
 *   data={students}
 *   columns={STUDENT_EXPORT_COLUMNS}
 *   filename="students"
 *   formats={["csv", "excel", "pdf"]}
 *   schoolId={schoolId}
 *   locale={lang}
 * />
 * ```
 */

// Types
export * from "./types";

// Configuration
export {
  SIZE_LIMITS,
  MIME_TYPES,
  PROVIDER_CONFIG,
  TIER_THRESHOLDS,
  FOLDER_STRUCTURE,
  EXPORT_CONFIG,
  IMPORT_CONFIG,
  PRINT_CONFIG,
  GENERATE_CONFIG,
  FILE_ICONS,
  DOCUMENT_ICONS,
  getCategoryFromMimeType,
  getSizeLimit,
  // formatBytes exported from shared
  // getAcceptForCategory exported from shared
} from "./config";

// Providers
export * from "./providers";

// Shared utilities
export * from "./shared";

// Upload module
export * from "./upload";

// Export module
export * from "./export";

// Import module
export * from "./import";

// Print module
export * from "./print";

// Generate module
export * from "./generate";

// Browser module
export * from "./browser";

// TODO: Add these exports as modules are implemented
// export * from "./download";
