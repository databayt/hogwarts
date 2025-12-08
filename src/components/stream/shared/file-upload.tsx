"use client";

import { useState } from "react";
import { X, File, Video, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileUploader, ACCEPT_VIDEOS, ACCEPT_DOCUMENTS, ACCEPT_IMAGES, type UploadedFileResult } from "@/components/file-upload/enhanced/file-uploader";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  accept: "video" | "material" | "image";
  disabled?: boolean;
  className?: string;
}

const ACCEPT_TYPES = {
  video: ACCEPT_VIDEOS,
  material: ACCEPT_DOCUMENTS,
  image: ACCEPT_IMAGES,
};

const CATEGORY_MAP = {
  video: "VIDEO" as const,
  material: "DOCUMENT" as const,
  image: "IMAGE" as const,
};

const MAX_SIZE = {
  video: 5 * 1024 * 1024 * 1024, // 5GB for videos (with S3), 500MB for Vercel Blob
  material: 50 * 1024 * 1024, // 50MB for documents
  image: 10 * 1024 * 1024, // 10MB for images
};

const ICONS = {
  video: Video,
  material: File,
  image: ImageIcon,
};

export function FileUpload({
  value,
  onChange,
  onRemove,
  accept,
  disabled = false,
  className,
}: FileUploadProps) {
  const [showUploader, setShowUploader] = useState(!value);
  const Icon = ICONS[accept];

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      const uploadedFile = files[0];
      const url = uploadedFile.cdnUrl || uploadedFile.url;
      onChange(url);
      setShowUploader(false);
      toast.success("File uploaded successfully");
    }
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const handleRemove = () => {
    if (!value || !onRemove) return;
    onRemove();
    setShowUploader(true);
    toast.success("File removed from form");
  };

  if (value && !showUploader) {
    return (
      <div className={cn("relative border rounded-md p-4", className)}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {accept === "video" && "Video uploaded"}
              {accept === "material" && "Material uploaded"}
              {accept === "image" && "Image uploaded"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{value}</p>
          </div>
          {onRemove && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Preview for videos and images */}
        {accept === "video" && (
          <div className="mt-4">
            <video
              src={value}
              controls
              className="w-full max-h-[300px] rounded-md"
            />
          </div>
        )}
        {accept === "image" && (
          <div className="mt-4">
            <img
              src={value}
              alt="Preview"
              className="w-full max-h-[300px] object-contain rounded-md"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <FileUploader
        category={CATEGORY_MAP[accept]}
        folder={`stream/${accept}`}
        accept={ACCEPT_TYPES[accept]}
        maxFiles={1}
        multiple={false}
        maxSize={MAX_SIZE[accept]}
        optimizeImages={accept === "image"}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
        className={disabled ? "opacity-50 pointer-events-none" : ""}
      />
    </div>
  );
}
