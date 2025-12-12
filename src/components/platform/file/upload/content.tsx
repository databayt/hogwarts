/**
 * Unified File Block - Upload Content Component
 * Main composition component for file uploads
 */

"use client";

import * as React from "react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FileCategory, FileType, StorageProvider, StorageTier } from "../types";
import { Uploader } from "./uploader";
import { BatchUploadProgress } from "./upload-progress";
import type { UploadResult } from "./use-upload";
import type { UploadProgress } from "../types";

// ============================================================================
// Types
// ============================================================================

interface UploadContentProps {
  title?: string;
  description?: string;
  category?: FileCategory;
  type?: FileType;
  folder?: string;
  provider?: StorageProvider;
  tier?: StorageTier;
  maxSize?: number;
  maxFiles?: number;
  showTabs?: boolean;
  tabs?: Array<{
    id: string;
    label: string;
    category: FileCategory;
    type?: FileType;
    maxSize?: number;
    accept?: Record<string, string[]>;
  }>;
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  dictionary?: {
    title?: string;
    description?: string;
    images?: string;
    documents?: string;
    videos?: string;
    other?: string;
  };
}

// ============================================================================
// Default Tabs Configuration
// ============================================================================

const defaultTabs = [
  {
    id: "images",
    label: "Images",
    category: "image" as FileCategory,
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  {
    id: "documents",
    label: "Documents",
    category: "document" as FileCategory,
    maxSize: 50 * 1024 * 1024, // 50MB
  },
  {
    id: "videos",
    label: "Videos",
    category: "video" as FileCategory,
    maxSize: 500 * 1024 * 1024, // 500MB
  },
  {
    id: "other",
    label: "Other",
    category: "other" as FileCategory,
    maxSize: 100 * 1024 * 1024, // 100MB
  },
];

// ============================================================================
// Component
// ============================================================================

export function UploadContent({
  title = "Upload Files",
  description = "Drag and drop files or click to browse",
  category = "document",
  type,
  folder,
  provider,
  tier,
  maxSize,
  maxFiles = 10,
  showTabs = false,
  tabs = defaultTabs,
  onUploadComplete,
  onUploadError,
  className,
  dictionary,
}: UploadContentProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "images");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);

  const handleUploadComplete = (results: UploadResult[]) => {
    setUploadedFiles((prev) => [...prev, ...results]);
    onUploadComplete?.(results);
  };

  const handleFilesChange = (files: UploadResult[]) => {
    // Update progress tracking
    const progressItems: UploadProgress[] = files.map((f, idx) => ({
      fileId: f.id || `file-${idx}`,
      fileName: f.originalName || `file-${idx}`,
      progress: 100,
      status: "success" as const,
    }));
    setUploadProgress(progressItems);
  };

  // ============================================================================
  // Tabbed Interface
  // ============================================================================

  if (showTabs) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle>{dictionary?.title || title}</CardTitle>
          <CardDescription>{dictionary?.description || description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id}>
                <Uploader
                  category={tab.category}
                  type={tab.type}
                  folder={folder}
                  provider={provider}
                  tier={tier}
                  maxSize={tab.maxSize || maxSize}
                  maxFiles={maxFiles}
                  accept={tab.accept}
                  onUploadComplete={handleUploadComplete}
                  onUploadError={onUploadError}
                  onFilesChange={handleFilesChange}
                />
              </TabsContent>
            ))}
          </Tabs>

          {/* Upload Progress */}
          {uploadProgress.length > 0 && (
            <div className="mt-4">
              <BatchUploadProgress items={uploadProgress} />
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // Simple Interface
  // ============================================================================

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{dictionary?.title || title}</CardTitle>
        <CardDescription>{dictionary?.description || description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Uploader
          category={category}
          type={type}
          folder={folder}
          provider={provider}
          tier={tier}
          maxSize={maxSize}
          maxFiles={maxFiles}
          onUploadComplete={handleUploadComplete}
          onUploadError={onUploadError}
          onFilesChange={handleFilesChange}
        />

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <div className="mt-4">
            <BatchUploadProgress items={uploadProgress} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Avatar Upload - Single image with circular preview
 */
export function AvatarUpload({
  onUploadComplete,
  onUploadError,
  currentImage,
  className,
}: {
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  currentImage?: string;
  className?: string;
}) {
  return (
    <Uploader
      category="image"
      type="avatar"
      folder="avatars"
      variant="avatar"
      maxSize={2 * 1024 * 1024} // 2MB
      maxFiles={1}
      className={className}
      onUploadComplete={(results) => results[0] && onUploadComplete?.(results[0])}
      onUploadError={onUploadError}
    />
  );
}

/**
 * Logo Upload - Single image for branding
 */
export function LogoUpload({
  onUploadComplete,
  onUploadError,
  className,
}: {
  onUploadComplete?: (result: UploadResult) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}) {
  return (
    <Uploader
      category="image"
      type="logo"
      folder="logos"
      maxSize={5 * 1024 * 1024} // 5MB
      maxFiles={1}
      className={className}
      onUploadComplete={(results) => results[0] && onUploadComplete?.(results[0])}
      onUploadError={onUploadError}
    />
  );
}

/**
 * Document Upload - PDF, Word, Excel files
 */
export function DocumentUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  className,
}: {
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
}) {
  return (
    <Uploader
      category="document"
      folder="documents"
      maxSize={50 * 1024 * 1024} // 50MB
      maxFiles={maxFiles}
      className={className}
      onUploadComplete={onUploadComplete}
      onUploadError={onUploadError}
    />
  );
}

/**
 * Assignment Upload - Student submissions
 */
export function AssignmentUpload({
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  className,
}: {
  onUploadComplete?: (results: UploadResult[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
}) {
  return (
    <Uploader
      category="document"
      type="assignment"
      folder="submissions"
      maxSize={100 * 1024 * 1024} // 100MB
      maxFiles={maxFiles}
      className={className}
      onUploadComplete={onUploadComplete}
      onUploadError={onUploadError}
    />
  );
}

export type { UploadContentProps };
