/**
 * Unified File Block - Upload Module Exports
 */

// Server Actions
export { uploadFile, uploadFiles, deleteFile, deleteFiles, getFiles, getFile, trackFileAccess } from "./actions";

// Components
export { Uploader, type UploaderProps } from "./uploader";
export { UploadButton, type UploadButtonProps } from "./upload-button";
export { UploadProgress, BatchUploadProgress, MinimalProgress, type UploadProgressProps, type BatchUploadProgressProps } from "./upload-progress";
export { UploadContent, AvatarUpload, LogoUpload, DocumentUpload, AssignmentUpload, type UploadContentProps } from "./content";

// Hooks
export { useUpload, type UseUploadOptions, type UseUploadReturn, type UploadResult } from "./use-upload";

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
