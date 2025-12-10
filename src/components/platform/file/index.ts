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

// ============================================================================
// Core Types (from main types.ts - authoritative definitions)
// ============================================================================
export type {
  // Storage
  StorageProvider,
  StorageTier,
  StorageProviderConfig,
  // File Categories
  FileCategory,
  ImageType,
  VideoType,
  DocumentType,
  FileType,
  FileMetadata,
  // Upload
  UploadConfig,
  UploadProgress as BaseUploadProgress,
  UploadResult as BaseUploadResult,
  BatchUploadResult,
  // Download
  DownloadOptions,
  BatchDownloadOptions,
  DownloadResult,
  // Print
  PageConfig,
  PrintOptions,
  PrintResult,
  // Document Generation
  GenerateDocumentType,
  BaseDocumentData,
  TemplateOptions,
  DocumentTemplate,
  GenerationOptions,
  GenerationResult,
  BatchGenerationRequest,
  BatchGenerationResult,
  // Browser
  BrowserView,
  BrowserFilter,
  BrowserSort,
  BrowserState,
  // Progress
  ProgressState,
  // Hook Return Types (base)
  UseUploadReturn as BaseUseUploadReturn,
  UsePrintReturn,
  UseGenerateReturn as BaseUseGenerateReturn,
  UseBrowserReturn,
} from "./types";

// ============================================================================
// Configuration
// ============================================================================
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
} from "./config";

// ============================================================================
// Providers
// ============================================================================
export * from "./providers";

// ============================================================================
// Shared utilities
// ============================================================================
export * from "./shared";

// ============================================================================
// Upload Module
// ============================================================================
export {
  // Server Actions
  uploadFile,
  uploadFiles,
  deleteFile,
  deleteFiles,
  getFiles,
  getFile,
  trackFileAccess,
  // Components
  Uploader,
  UploadButton,
  UploadProgress,
  BatchUploadProgress,
  MinimalProgress,
  UploadContent,
  AvatarUpload,
  LogoUpload,
  DocumentUpload,
  AssignmentUpload,
  // Hook
  useUpload,
  // Validation
  fileInfoSchema,
  uploadOptionsSchema,
  uploadRequestSchema,
  batchUploadRequestSchema,
  uploadResultSchema,
  uploadErrorSchema,
  uploadResponseSchema,
  validateFile,
  validateFiles,
} from "./upload";
export type {
  UploaderProps,
  UploadButtonProps,
  UploadProgressProps,
  BatchUploadProgressProps,
  UploadContentProps,
  UseUploadOptions,
  UseUploadReturn,
  UploadResult,
  FileInfo,
  UploadOptions,
  UploadRequest,
  BatchUploadRequest,
  UploadError,
  UploadResponse,
} from "./upload";

// ============================================================================
// Export Module
// ============================================================================
export {
  // Formatters
  formatValue,
  formatNumber,
  formatCurrency,
  formatDate,
  formatBoolean,
  formatPercentage,
  getValue,
  processRow as exportProcessRow,
  processRows,
  getHeader,
  getHeaders,
  sanitizeFilename,
  generateExportFilename,
  createColumnHelpers,
  // CSV
  generateCsvContent,
  exportToCsv,
  downloadBlob,
  parseCsvContent,
  // Excel
  exportToExcel,
  exportToExcelMultiSheet,
  exportFromTemplate,
  // PDF
  exportToPdf,
  PDFPreview,
  createPdfStyles,
  // Hook
  useExport,
  // Components
  ExportButton,
  SimpleExportButton,
} from "./export";
export type {
  ExportFormat,
  ColumnAlignment,
  ExportColumn,
  ExportConfig,
  ExportOptions,
  ExportResult,
  ExportProgress,
  UseExportReturn,
  ColumnHelpers,
  ExportButtonProps,
  SimpleExportButtonProps,
} from "./export";

// ============================================================================
// Import Module
// ============================================================================
export {
  // Parsers
  detectFormat,
  parseCsvFile,
  parseExcelFile,
  parseJsonFile,
  parseFile,
  autoMatchColumns,
  generatePreview,
  // Validators
  parseValue,
  validateValue,
  processRow as importProcessRow,
  validateRows,
  commonValidators,
  commonSchemas,
  // Hook
  useImport,
  // Components
  Importer,
} from "./import";
export type {
  ImportFormat,
  ImportColumn,
  ImportConfig,
  ImportRowError,
  ImportResult,
  ImportPreview,
  ImportProgress,
  ImportOptions,
  UseImportReturn,
  ImporterProps,
} from "./import";

// ============================================================================
// Print Module
// ============================================================================
export * from "./print";

// ============================================================================
// Generate Module
// ============================================================================
export * from "./generate";

// ============================================================================
// Browser Module
// ============================================================================
export * from "./browser";
