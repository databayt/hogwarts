/**
 * Unified File Block
 * Centralized file operations: upload, download, export, import, print, generate
 *
 * @example
 * ```tsx
 * import { ExportButton, Uploader, useUpload } from "@/components/file"
 *
 * // Upload files
 * <Uploader
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
// Shared Utilities (flattened from shared/)
// ============================================================================
export {
  // Formatters
  formatBytes,
  formatBytesAr,
  formatDate as formatFileDate,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  generateUniqueFilename,
  generateExportFilename as generateExportFilenameUtil,
  getFileExtension,
  getFileNameWithoutExtension,
  truncateFilename,
  getCategoryDisplayName,
  getTypeDisplayName,
} from "./formatters";

export {
  // MIME Types
  MIME_TO_EXTENSIONS,
  EXTENSION_TO_MIME,
  CATEGORY_MIME_TYPES,
  ACCEPT_IMAGES,
  ACCEPT_VIDEOS,
  ACCEPT_DOCUMENTS,
  ACCEPT_SPREADSHEETS,
  ACCEPT_CSV,
  ACCEPT_ALL,
  getMimeFromFilename,
  getCategoryFromMime,
  isInCategory,
  getAcceptForCategory,
  validateMimeType,
  getExtensionFromMime,
  isImage,
  isVideo,
  isDocument,
  isPreviewable,
} from "./mime-types";

export {
  // Icons
  CATEGORY_ICONS,
  FILE_TYPE_ICONS,
  EXTENSION_ICONS,
  STATUS_ICONS,
  ACTION_ICONS,
  getIconForCategory,
  getIconForType,
  getIconForExtension,
  getFileIcon,
} from "./icons";

// ============================================================================
// Rate Limiting (flat)
// ============================================================================
export {
  RATE_LIMITS,
  createUploadRateLimiter,
  createBandwidthRateLimiter,
  checkSchoolUploadLimit,
  checkUserUploadLimit,
  checkEndpointRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  getRateLimitAnalytics,
  formatRateLimitError,
  withRateLimit,
  createCustomRateLimiter,
} from "./rate-limit";
export type { RateLimitResult } from "./rate-limit";

// ============================================================================
// CDN (flat)
// ============================================================================
export {
  getCDNConfig,
  generateCDNUrl,
  generateSignedUrl,
  verifySignedUrl,
  generateOptimizedImageUrl,
  generateResponsiveSrcSet,
  generateThumbnailUrl,
  generatePrefetchLinks,
  getCacheControlHeaders,
  purgeCDNCache,
} from "./cdn";
export type { CDNConfig, ImageTransformOptions } from "./cdn";

// ============================================================================
// Storage Tier Management (flat)
// ============================================================================
export {
  DEFAULT_TIER_CONFIG,
  getTierConfig,
  determineInitialTier,
  determineProvider,
  evaluateTierChange,
  calculateStorageCost,
  calculateTierSavings,
  getStoragePath,
  batchEvaluateTierChanges,
  calculateTierStats,
} from "./tier-manager";
export type {
  StorageTier as TierStorageTier,
  StorageProvider as TierStorageProvider,
  TierConfig,
  FileMetrics,
  TierStats,
} from "./tier-manager";

// ============================================================================
// File Deduplication (flat)
// ============================================================================
export {
  generateFileHash,
  generateFileHashFromStream,
  generateFileHashFromFile,
  generateChunkHash,
  verifyFileHash,
  generateUploadId,
} from "./deduplication";

// ============================================================================
// Quota Management Module
// ============================================================================
export {
  getSchoolQuota,
  getQuotaStatus,
  checkQuota,
  incrementUsage,
  decrementUsage,
  resetDailyQuota,
  resetAllDailyQuotas,
  updateQuotaLimits,
  recalculateUsage,
  getQuotaStats,
  getQuotaByCategory,
  getQuotaByTier,
  DEFAULT_QUOTA,
  QUOTA_TIERS,
} from "./quota";
export type {
  QuotaTier,
  QuotaStatus,
  QuotaCheckResult,
  QuotaStats,
  QuotaByCategory,
  QuotaByTier,
  QuotaLimits,
} from "./quota";

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
// Chunked Upload (for large files up to 5GB)
// ============================================================================
export {
  initiateChunkedUpload,
  uploadChunk,
  completeChunkedUpload,
  abortChunkedUpload,
  useChunkedUpload,
} from "./upload";
export type {
  InitiateChunkedUploadInput,
  InitiateChunkedUploadResult,
  UploadChunkInput,
  UploadChunkResult,
  CompleteChunkedUploadInput,
  CompleteChunkedUploadResult,
  GetUploadStatusInput,
  GetUploadStatusResult,
  ChunkedUploadOptions,
  ChunkedUploadProgress,
} from "./upload";

// ============================================================================
// Enhanced File Uploader (drag-drop with optimization)
// Note: ACCEPT_IMAGES, ACCEPT_DOCUMENTS, ACCEPT_VIDEOS, ACCEPT_ALL are
// already exported from mime-types.ts above
// ============================================================================
export {
  FileUploader,
  FilePreview,
  AggregateProgress,
  useImageOptimization,
  detectImageFormat,
  supportsWebP,
  supportsAVIF,
} from "./upload";
export type {
  FileUploaderProps,
  UploadedFileResult,
} from "./upload";

// ============================================================================
// ImageKit Upload Hook
// ============================================================================
export {
  useImageKitUpload,
  IMAGEKIT_FOLDERS,
} from "./upload";
export type {
  ImageKitAuthParams,
  ImageKitUploadProgress,
  ImageKitUploadResult,
  UseImageKitUploadOptions,
  UseImageKitUploadReturn,
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
