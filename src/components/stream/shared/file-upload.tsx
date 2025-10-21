"use client";

import { useState } from "react";
import { Upload, X, File, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  accept: "video" | "material" | "image";
  disabled?: boolean;
  className?: string;
}

const ACCEPT_TYPES = {
  video: "video/mp4,video/webm,video/quicktime,video/x-msvideo",
  material: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip",
  image: "image/jpeg,image/png,image/gif,image/svg+xml,image/webp",
};

const MAX_SIZE_MB = {
  video: 500,
  material: 50,
  image: 10,
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
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const Icon = ICONS[accept];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = MAX_SIZE_MB[accept] * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${MAX_SIZE_MB[accept]}MB`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload to Vercel Blob
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", accept);

      const response = await fetch("/api/blob/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const data = await response.json();

      if (data.success && data.url) {
        onChange(data.url);
        toast({
          title: "Upload successful",
          description: "File uploaded successfully",
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!value || !onRemove) return;

    try {
      // Delete from Vercel Blob
      const response = await fetch("/api/blob/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: value }),
      });

      if (!response.ok) {
        const error = await response.json();

        // If file is referenced, just remove from form without deleting from blob
        if (error.referenced) {
          onRemove();
          toast({
            title: "File removed from form",
            description: "File is still used elsewhere and was not deleted",
          });
          return;
        }

        throw new Error(error.error || "Delete failed");
      }

      onRemove();
      toast({
        title: "File deleted",
        description: "File deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive",
      });
    }
  };

  if (value) {
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
      <label
        htmlFor={`file-upload-${accept}`}
        className={cn(
          "flex flex-col items-center justify-center border-2 border-dashed rounded-md p-8 cursor-pointer",
          "hover:border-primary/50 transition-colors",
          disabled && "opacity-50 cursor-not-allowed",
          isUploading && "pointer-events-none"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
        ) : (
          <Upload className="h-10 w-10 text-muted-foreground mb-4" />
        )}

        <p className="text-sm font-medium mb-1">
          {isUploading ? "Uploading..." : `Upload ${accept}`}
        </p>

        <p className="text-xs text-muted-foreground text-center">
          {accept === "video" && "MP4, WebM, MOV, AVI up to 500MB"}
          {accept === "material" && "PDF, DOC, PPT, XLS, ZIP up to 50MB"}
          {accept === "image" && "JPG, PNG, GIF, SVG, WebP up to 10MB"}
        </p>
      </label>

      <input
        id={`file-upload-${accept}`}
        type="file"
        accept={ACCEPT_TYPES[accept]}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
}
