"use client";

import { Uploader } from "@/components/file-upload/Uploader";

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: "image" | "video" | "document";
  placeholder?: string;
}

/**
 * File upload component for library book images and documents
 * Integrates with Hogwarts existing file uploader system
 *
 * Note: Currently uses object URLs for preview
 * TODO: Implement actual storage service (ImageKit, Cloudinary, S3, etc.) when needed
 */
export default function FileUpload({
  value,
  onChange,
  accept = "image",
  placeholder,
}: Props) {
  return (
    <div className="space-y-4">
      <Uploader
        fileTypeAccepted={accept}
        onChange={onChange}
        value={value}
      />
    </div>
  );
}
