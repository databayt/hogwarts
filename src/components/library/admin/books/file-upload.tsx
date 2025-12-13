"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Upload, Image as ImageIcon, FileText, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useImageKitUpload, IMAGEKIT_FOLDERS } from "@/components/file";

// ============================================================================
// Types
// ============================================================================

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "document";
  placeholder?: string;
}

const ACCEPT_TYPES = {
  image: {
    "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  },
  video: {
    "video/*": [".mp4", ".mov", ".avi", ".webm"],
  },
  document: {
    "application/pdf": [".pdf"],
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// Component
// ============================================================================

/**
 * ImageKit-powered file upload component for library book images
 * Uploads directly to ImageKit CDN with optimizations
 */
export default function FileUpload({
  value,
  onChange,
  accept = "image",
  placeholder,
}: Props) {
  const [showUploader, setShowUploader] = useState(!value);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ImageKit upload hook
  const { upload, progress, isUploading, error } = useImageKitUpload({
    folder: IMAGEKIT_FOLDERS.LIBRARY_BOOKS,
    onSuccess: (result) => {
      onChange(result.url);
      setShowUploader(false);
      setPreviewUrl(null);
      toast.success("File uploaded successfully to ImageKit");
    },
    onError: (err) => {
      toast.error(err);
    },
  });

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        toast.error("File size exceeds 10MB limit");
        return;
      }

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      }

      // Upload to ImageKit
      await upload(file);
    },
    [upload]
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPT_TYPES[accept],
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    multiple: false,
    disabled: isUploading,
  });

  // Handle remove
  const handleRemove = () => {
    onChange("");
    setShowUploader(true);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  // Get icon based on accept type
  const getIcon = () => {
    switch (accept) {
      case "image":
        return ImageIcon;
      case "video":
        return Film;
      case "document":
        return FileText;
      default:
        return Upload;
    }
  };

  const Icon = getIcon();

  // ============================================================================
  // Render: Uploaded File Preview
  // ============================================================================

  if (value && !showUploader) {
    return (
      <div className="space-y-4">
        <div className="relative border rounded-lg overflow-hidden">
          {accept === "image" && (
            <div className="relative w-full aspect-[3/4] bg-muted">
              <Image
                src={value}
                alt="Book cover"
                fill
                className="object-cover"
              />
            </div>
          )}
          {accept === "video" && (
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Film className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Video uploaded</p>
                <p className="text-xs text-muted-foreground truncate">{value}</p>
              </div>
            </div>
          )}
          {accept === "document" && (
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Document uploaded</p>
                <p className="text-xs text-muted-foreground truncate">{value}</p>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="absolute top-2 end-2 bg-background/80 backdrop-blur-sm"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render: Upload Dropzone
  // ============================================================================

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          isUploading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          {/* Preview during upload */}
          {previewUrl && accept === "image" && (
            <div className="relative w-32 h-44 mb-4 rounded-lg overflow-hidden">
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Upload progress */}
          {isUploading ? (
            <div className="w-full max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Uploading...</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <Icon className="w-12 h-12 mb-4 text-muted-foreground" />

              {isDragActive ? (
                isDragReject ? (
                  <p className="text-destructive">File type not accepted</p>
                ) : (
                  <p className="text-primary">Drop file here</p>
                )
              ) : (
                <>
                  <p className="text-lg font-medium mb-2">
                    {placeholder || `Drag & drop ${accept} here, or click to select`}
                  </p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Max file size: 10MB
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Files are uploaded to ImageKit CDN
                  </p>
                </>
              )}
            </>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive mt-4">{error}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
