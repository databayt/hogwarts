/**
 * Uploader Component
 * Simplified wrapper around centralized FileUploadButton
 * @deprecated Use FileUploadButton from @/components/file-uploader/file-uploader instead
 */

"use client";

import { FileUploadButton } from "./file-uploader/file-upload-button";
import type { FileMetadata, FileCategory } from "./types";

interface UploaderProps {
  fileTypeAccepted?: "image" | "video" | "document";
  onChange: (value: string) => void;
  value: string;
}

/**
 * @deprecated This component is deprecated. Use FileUploadButton directly:
 * ```tsx
 * import { FileUploadButton } from '@/components/file-uploader/file-uploader/file-upload-button';
 *
 * <FileUploadButton
 *   accept="image"
 *   onUpload={(metadata) => onChange(metadata.url)}
 * />
 * ```
 */
export function Uploader({ fileTypeAccepted = "image", onChange }: UploaderProps) {
  const handleUpload = (metadata: FileMetadata) => {
    onChange(metadata.url);
  };

  return (
    <FileUploadButton
      accept={fileTypeAccepted as FileCategory}
      onUpload={handleUpload}
      label="Upload File"
      description={`Select a ${fileTypeAccepted} to upload`}
    />
  );
}
