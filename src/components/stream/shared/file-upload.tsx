"use client";

import { useState } from "react";
import { Upload, X, File, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { uploadFileAction } from "@/components/file-uploader/actions";
import { useSession } from "next-auth/react";
import { FILE_SIZE_LIMITS } from "@/components/file-uploader/config/storage-config";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  accept: "video" | "material" | "image";
  disabled?: boolean;
  className?: string;
}

const ACCEPT_TYPES = {
  video: {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'video/x-msvideo': ['.avi'],
  },
  material: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'application/zip': ['.zip'],
  },
  image: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/svg+xml': ['.svg'],
    'image/webp': ['.webp'],
  },
};

const CATEGORY_MAP = {
  video: "video" as const,
  material: "document" as const,
  image: "image" as const,
};

const MAX_SIZE_MB = {
  video: FILE_SIZE_LIMITS.lesson_video,
  material: FILE_SIZE_LIMITS.document,
  image: FILE_SIZE_LIMITS.content_image,
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
  const { data: session } = useSession();
  const Icon = ICONS[accept];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    const maxSizeBytes = MAX_SIZE_MB[accept];
    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB`,
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload using centralized system
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `${session?.user?.schoolId}/stream/${accept}`);
      formData.append("category", CATEGORY_MAP[accept]);
      formData.append("type", accept === "material" ? "word" : accept);

      const result = await uploadFileAction(formData);

      if (result.success && result.metadata) {
        onChange(result.metadata.url);
        toast({
          title: "Upload successful",
          description: "File uploaded successfully",
        });
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    if (!value || !onRemove) return;

    // Simply remove from form - file stays in storage for potential reuse
    onRemove();
    toast({
      title: "File removed",
      description: "File removed from form (still available in storage)",
    });
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
          {accept === "video" && `MP4, WebM, MOV, AVI up to ${(MAX_SIZE_MB.video / (1024 * 1024 * 1024)).toFixed(1)}GB`}
          {accept === "material" && `PDF, DOC, PPT, XLS, ZIP up to ${(MAX_SIZE_MB.material / (1024 * 1024)).toFixed(0)}MB`}
          {accept === "image" && `JPG, PNG, GIF, SVG, WebP up to ${(MAX_SIZE_MB.image / (1024 * 1024)).toFixed(0)}MB`}
        </p>
      </label>

      <input
        id={`file-upload-${accept}`}
        type="file"
        accept={Object.keys(ACCEPT_TYPES[accept]).join(',')}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />
    </div>
  );
}
