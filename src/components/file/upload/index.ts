/**
 * Unified File Block - Upload Module Exports
 * Flat structure - all files at module root level
 */

// Server Actions
export { uploadFile, uploadFiles, deleteFile, deleteFiles, getFiles, getFile, trackFileAccess } from "./actions";

// Chunked Upload Actions
export {
  initiateChunkedUpload,
  uploadChunk,
  completeChunkedUpload,
  abortChunkedUpload,
} from "./chunked-actions";

// Chunked Upload Types
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
  UploadProgress as ChunkedUploadProgress,
} from "./chunked-types";

// Components
export { Uploader, type UploaderProps } from "./uploader";
export { UploadButton, type UploadButtonProps } from "./upload-button";
export { UploadProgress, BatchUploadProgress, MinimalProgress, type UploadProgressProps, type BatchUploadProgressProps } from "./upload-progress";
export { UploadContent, AvatarUpload, LogoUpload, DocumentUpload, AssignmentUpload, type UploadContentProps } from "./content";

// File Preview & Uploader (enhanced)
export { FileUploader, type FileUploaderProps, type UploadedFileResult } from "./file-uploader";
export { FilePreview } from "./file-preview";
export { UploadProgress as AggregateProgress } from "./aggregate-progress";

// Hooks
export { useUpload, type UseUploadOptions, type UseUploadReturn, type UploadResult } from "./use-upload";
export { useChunkedUpload } from "./use-chunked";
export { useImageOptimization, detectImageFormat, supportsWebP, supportsAVIF } from "./use-image-optimization";
export {
  useImageKitUpload,
  IMAGEKIT_FOLDERS,
  type ImageKitAuthParams,
  type UploadProgress as ImageKitUploadProgress,
  type UploadResult as ImageKitUploadResult,
  type UseImageKitUploadOptions,
  type UseImageKitUploadReturn,
} from "./use-imagekit-upload";

// Validation
export {
  fileInfoSchema,
  uploadOptionsSchema,
  uploadRequestSchema,
  batchUploadRequestSchema,
  uploadResultSchema,
  uploadErrorSchema,
  uploadResponseSchema,
  validateFile,
  validateFiles,
  type FileInfo,
  type UploadOptions,
  type UploadRequest,
  type BatchUploadRequest,
  type UploadError,
  type UploadResponse,
} from "./validation";
