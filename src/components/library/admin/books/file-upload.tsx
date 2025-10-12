"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  placeholder?: string;
}

export default function FileUpload({
  value,
  onChange,
  accept = "image/*",
  placeholder = "Upload file",
}: Props) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // TODO: Implement actual file upload logic
      // This is a placeholder - integrate with your file upload service
      // Options: ImageKit, Cloudinary, AWS S3, or main project's upload system

      const formData = new FormData();
      formData.append("file", file);

      // Placeholder: In production, replace with actual API endpoint
      // const response = await fetch("/api/upload", {
      //   method: "POST",
      //   body: formData,
      // });
      // const data = await response.json();
      // onChange(data.url);

      // For now, create a local object URL for preview
      const objectUrl = URL.createObjectURL(file);
      onChange(objectUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <Input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={isUploading}
        className="file-upload-input"
      />
      {value && (
        <div className="file-upload-preview">
          {accept.startsWith("image") ? (
            <img src={value} alt="Preview" className="file-upload-preview-image" />
          ) : (
            <p className="file-upload-preview-text">File uploaded</p>
          )}
        </div>
      )}
      {isUploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
    </div>
  );
}
