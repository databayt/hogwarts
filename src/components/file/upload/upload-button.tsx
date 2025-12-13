/**
 * Unified File Block - Upload Button Component
 * Simple button trigger for file upload
 */

"use client";

import * as React from "react";
import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Upload, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { FileCategory, FileType, StorageProvider, StorageTier } from "../types";
import { useUpload, type UploadResult } from "./use-upload";

// ============================================================================
// Types
// ============================================================================

interface UploadButtonProps extends Omit<ButtonProps, "onClick" | "type"> {
  category: FileCategory;
  fileType?: FileType;
  folder?: string;
  provider?: StorageProvider;
  tier?: StorageTier;
  maxSize?: number;
  allowedTypes?: string[];
  accept?: string;
  multiple?: boolean;
  onUploadStart?: () => void;
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function UploadButton({
  category,
  fileType,
  folder,
  provider,
  tier,
  maxSize,
  allowedTypes,
  accept,
  multiple = false,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  children,
  className,
  disabled,
  ...buttonProps
}: UploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");

  const {
    isUploading,
    error,
    upload,
    uploadMultiple,
  } = useUpload({
    category,
    type: fileType,
    folder,
    provider,
    tier,
    maxSize,
    allowedTypes,
    onSuccess: () => {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 2000);
    },
    onError: (err) => {
      setStatus("error");
      onUploadError?.(err);
      setTimeout(() => setStatus("idle"), 3000);
    },
  });

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      setStatus("uploading");
      onUploadStart?.();

      const fileArray = Array.from(files);

      if (multiple) {
        const results = await uploadMultiple(fileArray);
        if (results.length > 0) {
          onUploadComplete?.(results);
        }
      } else {
        const result = await upload(fileArray[0]);
        if (result) {
          onUploadComplete?.([result]);
        }
      }

      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [multiple, upload, uploadMultiple, onUploadStart, onUploadComplete]
  );

  // Generate accept string from category if not provided
  const getAcceptString = (): string => {
    if (accept) return accept;

    const categoryAccepts: Record<FileCategory, string> = {
      image: "image/*",
      video: "video/*",
      audio: "audio/*",
      document: ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv",
      archive: ".zip,.rar,.7z,.gz",
      other: "*/*",
    };

    return categoryAccepts[category];
  };

  const renderIcon = () => {
    switch (status) {
      case "uploading":
        return <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
      case "success":
        return <CheckCircle className="mr-2 h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="mr-2 h-4 w-4 text-destructive" />;
      default:
        return <Upload className="mr-2 h-4 w-4" />;
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={getAcceptString()}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled || isUploading}
        className={cn(className)}
        {...buttonProps}
      >
        {renderIcon()}
        {children || (isUploading ? "Uploading..." : "Upload")}
      </Button>
    </>
  );
}

export type { UploadButtonProps };
