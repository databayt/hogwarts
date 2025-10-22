/**
 * File Upload Types - Index
 * Central export point for all file upload types
 */

export type {
  // Storage
  StorageProvider,
  StorageTier,
  StorageProviderConfig,

  // File Types
  FileCategory,
  ImageType,
  VideoType,
  DocumentType,
  FileType,
  FileTypeConfig,

  // Metadata
  FileMetadata,

  // Upload Config
  UploadConfig,
  UploadOptions,
  UploadResult,
  BatchUploadResult,

  // Validation
  ValidationRule,
  ValidationResult,

  // State
  FileUploadState,
  UploadProgress,

  // Document Management
  DocumentRequirement,
  ManagedDocument,
  DocumentManagerState,

  // File Browser
  FileBrowserView,
  FileBrowserFilter,
  FileBrowserSort,
  FileBrowserState,

  // Server Actions
  UploadFileInput,
  DeleteFileInput,
  ListFilesInput,
  GetFileInput,

  // Component Props
  FileUploaderProps,
  FileUploadButtonProps,
  FileCardProps,
  FileListProps,
  DocumentManagerProps,
  FileBrowserProps,

  // Hook Returns
  UseFileUploadReturn,
  UseFileProgressReturn,
  UseFileBrowserReturn,
} from './file-upload';
