/**
 * File Upload Types
 * Comprehensive type definitions for the centralized file upload system
 */

import type { DropzoneProps } from 'react-dropzone';

// ============================================================================
// Storage Providers
// ============================================================================

export type StorageProvider = 'vercel_blob' | 'aws_s3' | 'cloudflare_r2';

export type StorageTier = 'hot' | 'warm' | 'cold';

export interface StorageProviderConfig {
  provider: StorageProvider;
  maxSize: number; // in bytes
  tier: StorageTier;
  accessPattern: 'frequent' | 'regular' | 'archive';
}

// ============================================================================
// File Types & Categories
// ============================================================================

export type FileCategory =
  | 'image'
  | 'video'
  | 'document'
  | 'audio'
  | 'archive'
  | 'other';

export type ImageType = 'avatar' | 'logo' | 'banner' | 'thumbnail' | 'content';
export type VideoType = 'lesson' | 'course' | 'assignment' | 'promotional';
export type DocumentType =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'powerpoint'
  | 'text'
  | 'certificate'
  | 'receipt'
  | 'student_record';

export type FileType = ImageType | VideoType | DocumentType;

export interface FileTypeConfig {
  category: FileCategory;
  type: FileType;
  accept: Record<string, readonly string[]>;
  maxSize: number;
  allowedMimeTypes: readonly string[];
  storageTier: StorageTier;
}

// ============================================================================
// File Metadata
// ============================================================================

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  type?: FileType;
  url: string;
  pathname?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  duration?: number; // for videos/audio in seconds
  uploadedAt: Date;
  uploadedBy: string;
  schoolId: string;
  folder: string;
  storageProvider: StorageProvider;
  storageTier: StorageTier;
  accessCount?: number;
  lastAccessedAt?: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Upload Configuration
// ============================================================================

export interface UploadConfig {
  accept?: DropzoneProps['accept'];
  maxSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  autoUpload?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  folder?: string;
  category?: FileCategory;
  type?: FileType;
  metadata?: Record<string, unknown>;
}

export interface UploadOptions extends UploadConfig {
  schoolId: string;
  userId: string;
  onProgress?: (progress: number) => void;
  onSuccess?: (metadata: FileMetadata) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Upload Results
// ============================================================================

export interface UploadResult {
  success: boolean;
  metadata?: FileMetadata;
  error?: string;
}

export interface BatchUploadResult {
  success: boolean;
  results: UploadResult[];
  failed: number;
  succeeded: number;
}

// ============================================================================
// File Validation
// ============================================================================

export interface ValidationRule {
  maxSize?: number;
  minSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
  dimensions?: {
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: number;
  };
  duration?: {
    min?: number;
    max?: number;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// File Upload State
// ============================================================================

export interface FileUploadState {
  file: File;
  preview?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  metadata?: FileMetadata;
  error?: string;
}

export interface UploadProgress {
  [fileId: string]: number;
}

// ============================================================================
// Document Management (for student records, certificates, etc.)
// ============================================================================

export interface DocumentRequirement {
  type: DocumentType;
  required: boolean;
  label: string;
  description?: string;
  maxSize?: number;
  accept?: string[];
}

export interface ManagedDocument {
  id: string;
  type: DocumentType;
  file?: File;
  url?: string;
  metadata?: FileMetadata;
  uploadedAt?: Date;
  verifiedAt?: Date;
  isVerified?: boolean;
}

export interface DocumentManagerState {
  documents: ManagedDocument[];
  requirements: DocumentRequirement[];
  completed: number;
  total: number;
}

// ============================================================================
// File Browser
// ============================================================================

export type FileBrowserView = 'grid' | 'table' | 'list';

export interface FileBrowserFilter {
  category?: FileCategory;
  type?: FileType;
  uploadedBy?: string;
  folder?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

export interface FileBrowserSort {
  field: 'name' | 'size' | 'uploadedAt' | 'type';
  direction: 'asc' | 'desc';
}

export interface FileBrowserState {
  files: FileMetadata[];
  view: FileBrowserView;
  filter: FileBrowserFilter;
  sort: FileBrowserSort;
  selected: string[];
  loading: boolean;
  error?: string;
}

// ============================================================================
// Server Actions
// ============================================================================

export interface UploadFileInput {
  file: File;
  folder: string;
  category: FileCategory;
  type?: FileType;
  schoolId: string;
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface DeleteFileInput {
  url: string;
  schoolId: string;
  userId: string;
  force?: boolean; // Delete even if referenced
}

export interface ListFilesInput {
  schoolId: string;
  folder?: string;
  category?: FileCategory;
  type?: FileType;
  limit?: number;
  offset?: number;
}

export interface GetFileInput {
  id: string;
  schoolId: string;
}

// ============================================================================
// Component Props
// ============================================================================

export interface FileUploaderProps extends Omit<UploadConfig, 'folder'> {
  value?: File[];
  onValueChange?: (files: File[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  progresses?: Record<string, number>;
  className?: string;
}

export interface FileUploadButtonProps {
  accept: FileCategory | string;
  maxSize?: number;
  onUpload: (metadata: FileMetadata) => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

export interface FileCardProps {
  file: File | FileMetadata;
  progress?: number;
  onRemove?: () => void;
  onView?: () => void;
  showActions?: boolean;
  className?: string;
}

export interface FileListProps {
  files: (File | FileMetadata)[];
  progresses?: Record<string, number>;
  onRemove?: (index: number) => void;
  onView?: (index: number) => void;
  className?: string;
}

export interface DocumentManagerProps {
  requirements: DocumentRequirement[];
  documents: ManagedDocument[];
  onChange: (documents: ManagedDocument[]) => void;
  disabled?: boolean;
  className?: string;
}

export interface FileBrowserProps {
  schoolId: string;
  folder?: string;
  initialView?: FileBrowserView;
  allowUpload?: boolean;
  allowDelete?: boolean;
  allowSelect?: boolean;
  onSelect?: (files: FileMetadata[]) => void;
  className?: string;
}

// ============================================================================
// Hook Return Types
// ============================================================================

export interface UseFileUploadReturn {
  upload: (file: File) => Promise<UploadResult>;
  uploadMultiple: (files: File[]) => Promise<BatchUploadResult>;
  progress: UploadProgress;
  isUploading: boolean;
  error: Error | null;
  reset: () => void;
}

export interface UseFileProgressReturn {
  progress: UploadProgress;
  setProgress: (fileId: string, progress: number) => void;
  resetProgress: (fileId?: string) => void;
}

export interface UseFileBrowserReturn {
  state: FileBrowserState;
  actions: {
    setView: (view: FileBrowserView) => void;
    setFilter: (filter: Partial<FileBrowserFilter>) => void;
    setSort: (sort: FileBrowserSort) => void;
    toggleSelect: (fileId: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    refresh: () => Promise<void>;
    deleteSelected: () => Promise<void>;
  };
}
