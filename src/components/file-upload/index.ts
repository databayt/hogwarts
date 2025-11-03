/**
 * File Uploader Components
 * Export all file upload UI components
 */

// Core components
export { FileUploader } from './file-uploader/file-uploader';
export { EnhancedDropzone } from './file-uploader/enhanced-dropzone';
export { FileCard } from './file-uploader/file-card';
export { FileList } from './file-uploader/file-list';
export { FileUploadButton } from './file-uploader/file-upload-button';

// Advanced components
export { UploadQueue } from './file-uploader/upload-queue';
export { EnhancedFileBrowser } from './file-uploader/enhanced-file-browser';
export { FilePreview } from './file-uploader/file-preview';
export { StorageQuota } from './file-uploader/storage-quota';
export { MobileUploadSheet } from './file-uploader/mobile-upload-sheet';
export { FileActionsToolbar } from './file-uploader/file-actions-toolbar';

// Document management
export { DocumentManager } from './file-uploader/document-manager';
export { FileBrowser } from './file-uploader/file-browser';

// Hooks
export { useFileUpload } from './hooks/use-file-upload';
export { useFileProgress } from './hooks/use-file-progress';
export { useFileBrowser } from './hooks/use-file-browser';

// Types
export type {
  FileCategory,
  FileType,
  FileMetadata,
  FileUploadState,
  FileUploaderProps,
  UploadConfig,
  UploadOptions,
  UploadResult,
  BatchUploadResult,
  FileBrowserView,
  FileBrowserFilter,
  FileBrowserSort,
  StorageProvider,
  StorageTier,
  DocumentRequirement,
  ManagedDocument,
} from './types';

// Utils
export { formatBytes, getFileTypeLabel, getCategoryLabel } from './lib/formatters';
export { validateFile, validateFiles } from './lib/validation';

// Config
export { FILE_TYPE_CONFIGS, getFileTypeConfig, detectCategory } from './config/file-types';
export { STORAGE_CONFIG, getStorageProvider } from './config/storage-config';