"use client";

import { useState } from "react";
import { FileUploader, ACCEPT_IMAGES, ACCEPT_VIDEOS, ACCEPT_DOCUMENTS, type UploadedFileResult } from "@/components/file-upload/enhanced/file-uploader";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "document";
  placeholder?: string;
}

const ACCEPT_TYPES = {
  image: ACCEPT_IMAGES,
  video: ACCEPT_VIDEOS,
  document: ACCEPT_DOCUMENTS,
};

const CATEGORY_MAP = {
  image: "IMAGE" as const,
  video: "VIDEO" as const,
  document: "DOCUMENT" as const,
};

/**
 * File upload component for library book images and documents
 * Migrated to use enhanced FileUploader system
 */
export default function FileUpload({
  value,
  onChange,
  accept = "image",
  placeholder,
}: Props) {
  const [showUploader, setShowUploader] = useState(!value);

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
    onChange("");
    setShowUploader(true);
  };

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
          {accept === "document" && (
            <div className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
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

  return (
    <div className="space-y-4">
      <FileUploader
        category={CATEGORY_MAP[accept]}
        folder="library/books"
        accept={ACCEPT_TYPES[accept]}
        maxFiles={1}
        multiple={false}
        maxSize={10 * 1024 * 1024} // 10MB max
        optimizeImages={accept === "image"}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />
    </div>
  );
}
