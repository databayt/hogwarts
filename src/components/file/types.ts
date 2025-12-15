/**
 * Unified File Block - Type Definitions
 * Comprehensive types for upload, download, export, import, print, and generate operations
 */

import type { z } from "zod"

// ============================================================================
// Storage Providers
// ============================================================================

export type StorageProvider =
  | "vercel_blob"
  | "aws_s3"
  | "cloudflare_r2"
  | "imagekit"
export type StorageTier = "hot" | "warm" | "cold"

export interface StorageProviderConfig {
  provider: StorageProvider
  maxSize: number
  tier: StorageTier
  accessPattern: "frequent" | "regular" | "archive"
}

// ============================================================================
// File Categories & Types
// ============================================================================

export type FileCategory =
  | "image"
  | "video"
  | "document"
  | "audio"
  | "archive"
  | "other"

export type ImageType = "avatar" | "logo" | "banner" | "thumbnail" | "content"
export type VideoType = "lesson" | "course" | "assignment" | "promotional"
export type DocumentType =
  | "pdf"
  | "word"
  | "excel"
  | "powerpoint"
  | "text"
  | "certificate"
  | "receipt"
  | "invoice"
  | "report"
  | "transcript"
  | "id_card"

export type FileType = ImageType | VideoType | DocumentType

// ============================================================================
// File Metadata
// ============================================================================

export interface FileMetadata {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  category: FileCategory
  type?: FileType
  url: string
  pathname?: string
  dimensions?: {
    width: number
    height: number
  }
  duration?: number
  uploadedAt: Date
  uploadedBy: string
  schoolId: string
  folder: string
  storageProvider: StorageProvider
  storageTier: StorageTier
  accessCount?: number
  lastAccessedAt?: Date
  metadata?: Record<string, unknown>
}

// ============================================================================
// Upload Types
// ============================================================================

export interface UploadConfig {
  accept?: Record<string, string[]>
  maxSize?: number
  maxFiles?: number
  multiple?: boolean
  autoUpload?: boolean
  folder?: string
  category?: FileCategory
  type?: FileType
  purpose?: string
  metadata?: Record<string, unknown>
}

export interface UploadProgress {
  fileId: string
  fileName: string
  /** Alias for fileName (backward compatibility) */
  filename?: string
  progress: number
  /** Alias for progress (backward compatibility) */
  percentage?: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
  loaded?: number
  total?: number
  currentFile?: number
  totalFiles?: number
}

export interface UploadResult {
  success: boolean
  metadata?: FileMetadata
  error?: string
}

export interface BatchUploadResult {
  success: boolean
  results: UploadResult[]
  succeeded: number
  failed: number
}

// ============================================================================
// Download Types
// ============================================================================

export interface DownloadOptions {
  filename?: string
  onProgress?: (progress: number) => void
}

export interface BatchDownloadOptions extends DownloadOptions {
  zipFilename?: string
  preserveFolders?: boolean
}

export interface DownloadResult {
  success: boolean
  blob?: Blob
  error?: string
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = "csv" | "excel" | "pdf" | "json"

export interface ExportColumn<T = unknown> {
  /** Key in the data object */
  key: keyof T | string
  /** Column header text (English) */
  header: string
  /** Arabic header for i18n */
  headerAr?: string
  /** Column width for Excel/PDF */
  width?: number
  /** Value formatter */
  formatter?: (value: unknown, row: T, locale: string) => string | number
  /** Include in specific formats only */
  formats?: ExportFormat[]
  /** Nested path support (e.g., "student.name") */
  path?: string
}

export interface ExportConfig<T = unknown> {
  /** Entity name for filename generation */
  entityName: string
  /** Column definitions */
  columns: ExportColumn<T>[]
  /** Supported formats */
  formats?: ExportFormat[]
  /** PDF template name */
  pdfTemplate?: string
  /** Excel sheet name */
  sheetName?: string
  /** Include metadata sheet in Excel */
  includeMetadata?: boolean
  /** Batch size for large datasets */
  batchSize?: number
  /** Custom filename generator */
  filenameGenerator?: (format: ExportFormat, locale: string) => string
}

export interface ExportOptions {
  format: ExportFormat
  locale?: "en" | "ar"
  filters?: Record<string, unknown>
  includeHeaders?: boolean
  dateRange?: { from: Date; to: Date }
  schoolId: string
  schoolName?: string
  metadata?: Record<string, unknown>
  onProgress?: (progress: number) => void
}

export interface ExportResult {
  success: boolean
  data?: Blob | string
  filename?: string
  rowCount?: number
  error?: string
}

// ============================================================================
// Import Types
// ============================================================================

export type ImportFormat = "csv" | "excel" | "json"

export interface ImportColumn {
  /** Source column name in file */
  sourceColumn: string
  /** Target field in database */
  targetField: string
  /** Is this field required? */
  required: boolean
  /** Data type for parsing */
  type: "string" | "number" | "date" | "boolean" | "email" | "phone" | "enum"
  /** Enum values if type is enum */
  enumValues?: string[]
  /** Alternative column names (fuzzy matching) */
  alternateNames?: string[]
  /** Transform function */
  transform?: (value: unknown) => unknown
  /** Custom validator */
  validate?: (value: unknown) => boolean
  /** Default value if empty */
  defaultValue?: unknown
}

export interface ImportConfig<T, TCreate = T> {
  entityName: string
  schema: z.ZodSchema<T>
  mappings: ImportColumn[]
  createRecord: (data: TCreate, schoolId: string) => Promise<{ id: string }>
  updateRecord?: (
    id: string,
    data: Partial<TCreate>,
    schoolId: string
  ) => Promise<void>
  duplicateDetection?: {
    fields: (keyof T)[]
    findExisting: (
      criteria: Partial<T>,
      schoolId: string
    ) => Promise<{ id: string } | null>
  }
  relationships?: RelationshipConfig<T>[]
  maxRows?: number
  batchSize?: number
  beforeImport?: (data: T[], schoolId: string) => Promise<T[]>
  afterImport?: (results: ImportRowResult[], schoolId: string) => Promise<void>
}

export interface RelationshipConfig<T> {
  sourceField: keyof T
  targetField: string
  lookup: (value: unknown, schoolId: string) => Promise<string | null>
  required: boolean
  notFoundMessage?: string
}

export interface ImportOptions {
  content: string | ArrayBuffer
  format: ImportFormat
  validateOnly?: boolean
  updateExisting?: boolean
  skipDuplicates?: boolean
  schoolId: string
  userId: string
  onProgress?: (progress: number) => void
  onRowProcessed?: (row: number, success: boolean) => void
}

export interface ImportRowResult {
  row: number
  success: boolean
  id?: string
  errors?: string[]
  warnings?: string[]
  data?: Record<string, unknown>
}

export interface ImportResult {
  success: boolean
  totalRows: number
  successCount: number
  errorCount: number
  updatedCount: number
  skippedCount: number
  errors: ImportRowResult[]
  warnings: ImportRowResult[]
  importedIds?: string[]
  message?: string
  error?: string
}

export interface ImportPreview {
  headers: string[]
  rows: Record<string, unknown>[]
  mappedColumns: string[]
  unmappedColumns: string[]
  totalRows: number
}

// ============================================================================
// Print Types
// ============================================================================

export interface PageConfig {
  size: "A4" | "Letter" | "Legal" | "A3" | "A5"
  orientation: "portrait" | "landscape"
  margins: {
    top: number
    right: number
    bottom: number
    left: number
  }
}

export interface PrintOptions {
  pageConfig?: Partial<PageConfig>
  title?: string
  colorMode?: "color" | "grayscale" | "blackAndWhite"
  scale?: number
  printBackground?: boolean
  headerHtml?: string
  footerHtml?: string
}

export interface PrintResult {
  success: boolean
  cancelled?: boolean
  error?: string
}

// ============================================================================
// Document Generation Types
// ============================================================================

export type GenerateDocumentType =
  | "invoice"
  | "receipt"
  | "certificate"
  | "report_card"
  | "id_card"
  | "transcript"

export interface BaseDocumentData {
  schoolId: string
  school: {
    name: string
    logoUrl?: string
    address?: string
    phone?: string
    email?: string
    website?: string
  }
  branding?: {
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
  }
  language: "en" | "ar"
  generatedAt: Date
  generatedBy: string
}

export interface TemplateOptions {
  pageSize: "A4" | "Letter"
  orientation: "portrait" | "landscape"
  colorScheme: "default" | "school" | "custom"
  customColors?: {
    primary: string
    secondary: string
    accent: string
  }
  includeHeader: boolean
  includeFooter: boolean
  includeWatermark: boolean
  watermarkText?: string
  includeSignatures: boolean
  includeLogo: boolean
}

export interface DocumentTemplate<TData = unknown> {
  id: string
  name: string
  type: GenerateDocumentType
  version: string
  defaultOptions: TemplateOptions
  supportedLanguages: ("en" | "ar")[]
  previewImage?: string
}

export interface GenerationOptions {
  format: "pdf" | "image" | "html"
  quality: "draft" | "standard" | "high"
  saveToStorage: boolean
  storageFolder?: string
  notifyOnComplete?: boolean
}

export interface GenerationResult {
  success: boolean
  documentUrl?: string
  documentBlob?: Blob
  fileName?: string
  fileSize?: number
  error?: string
  metadata?: {
    generatedAt: Date
    processingTime: number
    template: string
    version: string
  }
}

export interface BatchGenerationRequest<TData> {
  templateId: string
  items: TData[]
  options: GenerationOptions & TemplateOptions
  maxConcurrent?: number
  onProgress?: (completed: number, total: number) => void
}

export interface BatchGenerationResult {
  success: boolean
  results: GenerationResult[]
  zipUrl?: string
  successCount: number
  failureCount: number
  totalSize: number
  errors?: { index: number; error: string }[]
}

// ============================================================================
// File Browser Types
// ============================================================================

export type BrowserView = "grid" | "list" | "table"

export interface BrowserFilter {
  category?: FileCategory
  type?: FileType
  folder?: string
  uploadedBy?: string
  dateRange?: { from: Date; to: Date }
  search?: string
}

export interface BrowserSort {
  field: "name" | "size" | "uploadedAt" | "type"
  direction: "asc" | "desc"
}

export interface BrowserState {
  files: FileMetadata[]
  view: BrowserView
  filter: BrowserFilter
  sort: BrowserSort
  selected: string[]
  loading: boolean
  error?: string
}

// ============================================================================
// Progress Types
// ============================================================================

export interface ProgressState {
  phase: "parsing" | "validating" | "processing" | "complete"
  progress: number
  currentRow?: number
  totalRows?: number
  message?: string
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseUploadReturn {
  upload: (file: File) => Promise<UploadResult>
  uploadMultiple: (files: File[]) => Promise<BatchUploadResult>
  uploads: UploadProgress[]
  isUploading: boolean
  reset: () => void
}

export interface UseExportReturn<T> {
  exportData: (
    data: T[],
    format: ExportFormat,
    config: ExportConfig<T>
  ) => Promise<ExportResult>
  isExporting: boolean
  progress: number
  error: string | null
}

export interface UseImportReturn {
  importFile: (
    file: File,
    options?: Partial<ImportOptions>
  ) => Promise<ImportResult>
  previewFile: (
    file: File,
    format: ImportFormat
  ) => Promise<ImportPreview | null>
  downloadTemplate: (filename?: string) => void
  isImporting: boolean
  isPreviewing: boolean
  progress: ProgressState
  error: string | null
  result: ImportResult | null
  previewData: ImportPreview | null
  reset: () => void
}

export interface UsePrintReturn {
  print: (options?: PrintOptions) => Promise<PrintResult>
  printToPDF: (options?: PrintOptions) => Promise<Blob | null>
  openPreview: (options?: PrintOptions) => void
  closePreview: () => void
  isPrinting: boolean
  isPreviewOpen: boolean
  printRef: React.RefObject<HTMLDivElement>
}

export interface UseGenerateReturn<TData> {
  generate: (
    data: TData,
    options?: Partial<GenerationOptions & TemplateOptions>
  ) => Promise<GenerationResult>
  preview: (
    data: TData,
    options?: Partial<TemplateOptions>
  ) => Promise<string | null>
  isGenerating: boolean
  progress: number
  error: string | null
}

export interface UseBrowserReturn {
  state: BrowserState
  actions: {
    setView: (view: BrowserView) => void
    setFilter: (filter: Partial<BrowserFilter>) => void
    setSort: (sort: BrowserSort) => void
    toggleSelect: (fileId: string) => void
    selectAll: () => void
    clearSelection: () => void
    refresh: () => Promise<void>
    deleteSelected: () => Promise<void>
  }
}
