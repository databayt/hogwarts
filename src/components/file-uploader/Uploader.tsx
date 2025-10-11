"use client";

import { FileUploader } from "@/components/operator/file-uploader";
import { useState } from "react";

interface UploaderProps {
  fileTypeAccepted?: "image" | "video" | "document";
  onChange: (value: string) => void;
  value: string;
}

/**
 * Adapter component for the file uploader
 * Wraps the existing FileUploader component to work with string values (URLs)
 */
export function Uploader({ fileTypeAccepted = "image", onChange, value }: UploaderProps) {
  const [files, setFiles] = useState<File[]>([]);

  const accept = {
    image: { "image/*": [] },
    video: { "video/*": [] },
    document: { "application/pdf": [] },
  }[fileTypeAccepted];

  const handleUpload = async (uploadedFiles: File[]) => {
    // TODO: Implement actual file upload to storage service
    // For now, create a temporary object URL
    if (uploadedFiles.length > 0) {
      const url = URL.createObjectURL(uploadedFiles[0]);
      onChange(url);
    }
  };

  return (
    <FileUploader
      value={files}
      onValueChange={setFiles}
      onUpload={handleUpload}
      accept={accept}
      maxSize={5 * 1024 * 1024} // 5MB
      maxFiles={1}
    />
  );
}
