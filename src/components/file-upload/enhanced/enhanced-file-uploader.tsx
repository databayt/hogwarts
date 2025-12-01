/**
 * Enhanced File Uploader Component
 * Production-ready file upload with all advanced features
 */

'use client';

import * as React from 'react';
import { useCallback, useState } from 'react';
import { Upload, X, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useChunkedUpload, formatSpeed, formatETA, formatFileSize } from './use-chunked-upload';
import { useImageOptimization } from './use-image-optimization';
import { useDropzone } from 'react-dropzone';
import type { FileCategory } from '../types';

// ============================================================================
// Types
// ============================================================================

interface EnhancedFileUploaderProps {
  schoolId: string;
  userId: string;
  category?: FileCategory;
  folder?: string;
  maxSize?: number; // bytes
  maxFiles?: number;
  accept?: Record<string, string[]>;
  autoUpload?: boolean;
  optimizeImages?: boolean;
  showQuota?: boolean;
  onUploadComplete?: (fileIds: string[]) => void;
  className?: string;
  dictionary?: any; // i18n dictionary
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
  optimized?: boolean;
}

// ============================================================================
// Main Component
// ============================================================================

export function EnhancedFileUploader({
  schoolId,
  userId,
  category = 'other',
  folder,
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB
  maxFiles = 10,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    'video/*': ['.mp4', '.webm', '.ogg'],
    'application/pdf': ['.pdf'],
  },
  autoUpload = false,
  optimizeImages = true,
  showQuota = true,
  onUploadComplete,
  className,
  dictionary,
}: EnhancedFileUploaderProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateFile, setDuplicateFile] = useState<FileWithPreview | null>(null);

  const {
    uploadFile,
    uploadMultiple,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryFailed,
    clearCompleted,
    progress,
    isUploading,
  } = useChunkedUpload({
    onSuccess: (fileId) => {
      toast.success('File uploaded successfully');
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error}`);
    },
  });

  const {
    optimizeImage,
    canOptimize,
    generateThumbnail,
    isOptimizing,
    lastResult,
  } = useImageOptimization({
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.85,
    format: 'webp',
  });

  // Handle file drop
  const onDrop = useCallback(
    async (acceptedFiles: File[], rejectedFiles: any[]) => {
      // Handle rejections
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          if (error.code === 'file-too-large') {
            toast.error(`${file.name} exceeds ${formatFileSize(maxSize)} limit`);
          } else if (error.code === 'file-invalid-type') {
            toast.error(`${file.name} has an invalid file type`);
          } else if (error.code === 'too-many-files') {
            toast.error(`Maximum ${maxFiles} files allowed`);
          } else {
            toast.error(`${file.name}: ${error.message}`);
          }
        });
      });

      // Process accepted files
      const newFiles: FileWithPreview[] = [];

      for (const file of acceptedFiles) {
        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        let processedFile: File = file;

        // Optimize images if enabled
        if (optimizeImages && canOptimize(file)) {
          try {
            const optimized = await optimizeImage(file);

            if (lastResult && lastResult.reduction > 10) {
              toast.success(
                `Optimized ${file.name}: ${formatFileSize(lastResult.originalSize)} → ${formatFileSize(
                  lastResult.optimizedSize
                )} (${lastResult.reduction.toFixed(0)}% smaller)`
              );
            }

            processedFile = optimized;
          } catch (error) {
            console.error('Image optimization failed:', error);
          }
        }

        // Generate preview for images
        let preview: string | undefined;
        if (processedFile.type.startsWith('image/')) {
          try {
            preview = await generateThumbnail(processedFile);
          } catch (error) {
            console.error('Thumbnail generation failed:', error);
          }
        }

        const fileWithPreview: FileWithPreview = Object.assign(processedFile, {
          id,
          preview,
          optimized: processedFile !== file,
        });

        newFiles.push(fileWithPreview);
      }

      setFiles((prev) => [...prev, ...newFiles]);

      // Auto-upload if enabled
      if (autoUpload && newFiles.length > 0) {
        for (const file of newFiles) {
          await uploadFile(file, (category || 'OTHER') as any);
        }
      }
    },
    [
      maxSize,
      maxFiles,
      optimizeImages,
      canOptimize,
      optimizeImage,
      generateThumbnail,
      lastResult,
      autoUpload,
      uploadFile,
      category,
    ]
  );

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept,
    maxSize,
    maxFiles,
    multiple: maxFiles > 1,
  });

  // Handle manual upload
  const handleUploadAll = useCallback(async () => {
    const filesToUpload = files.filter(
      (file) => !progress[file.name] || progress[file.name].status === 'failed'
    );

    if (filesToUpload.length === 0) {
      toast.info('No files to upload');
      return;
    }

    const results = await uploadMultiple(filesToUpload, (category || 'OTHER') as any);
    const successfulIds = results
      .filter((r): r is { success: true; fileId: string } => r.success && 'fileId' in r)
      .map((r) => r.fileId);

    if (successfulIds.length > 0) {
      onUploadComplete?.(successfulIds);
    }
  }, [files, progress, uploadMultiple, category, onUploadComplete]);

  // Handle file removal
  const handleRemoveFile = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (file) {
        // Cancel upload if in progress
        if (progress[file.name] && progress[file.name].status === 'uploading') {
          cancelUpload(file.name);
        }

        // Revoke preview URL if exists
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }

        // Remove from state
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      }
    },
    [files, progress, cancelUpload]
  );

  // Clean up previews on unmount
  React.useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  // Calculate overall progress
  const totalProgress = React.useMemo(() => {
    const progressValues = Object.values(progress);
    if (progressValues.length === 0) return 0;

    const total = progressValues.reduce((acc, curr) => acc + curr.progress, 0);
    return total / progressValues.length;
  }, [progress]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-lg border-2 border-dashed p-8 transition-all',
          'hover:border-primary/50 hover:bg-muted/50',
          isDragActive && 'border-primary bg-primary/5',
          isDragReject && 'border-destructive bg-destructive/5',
          'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="rounded-full border border-dashed p-4">
            <Upload
              className={cn(
                'h-8 w-8 text-muted-foreground',
                isDragActive && 'text-primary',
                isDragReject && 'text-destructive'
              )}
            />
          </div>

          <div className="space-y-2">
            <p className="text-lg font-medium">
              {isDragActive
                ? 'Drop files here'
                : isDragReject
                ? 'Some files will be rejected'
                : dictionary?.dropzone?.title || 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-sm text-muted-foreground">
              {dictionary?.dropzone?.subtitle ||
                `Up to ${maxFiles} files, max ${formatFileSize(maxSize)} each`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {Object.keys(accept).map((type) => (
              <Badge key={type} variant="secondary">
                {type}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* File List with Upload Progress */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Overall Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{Math.round(totalProgress)}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-2" />
                </div>
              )}

              {/* File List */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  <AnimatePresence>
                    {files.map((file) => {
                      const fileProgress = progress[file.name];
                      const isUploading = fileProgress?.status === 'uploading';
                      const isPaused = fileProgress?.status === 'paused';
                      const isCompleted = fileProgress?.status === 'completed';
                      const isFailed = fileProgress?.status === 'failed';

                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="rounded-lg border p-3"
                        >
                          <div className="flex items-start gap-3">
                            {/* File Preview */}
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="h-12 w-12 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                                <File className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}

                            {/* File Info */}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium line-clamp-1">
                                  {file.name}
                                </p>
                                {!isCompleted && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => handleRemoveFile(file.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatFileSize(file.size)}</span>
                                {file.optimized && (
                                  <Badge variant="secondary" className="h-5">
                                    Optimized
                                  </Badge>
                                )}
                                {fileProgress && (
                                  <>
                                    {isUploading && (
                                      <>
                                        <span>•</span>
                                        <span>{formatSpeed(fileProgress.speed)}</span>
                                        <span>•</span>
                                        <span>ETA: {formatETA(fileProgress.eta)}</span>
                                      </>
                                    )}
                                    {isCompleted && (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    )}
                                    {isFailed && (
                                      <AlertCircle className="h-4 w-4 text-destructive" />
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Upload Progress */}
                              {fileProgress && !isCompleted && (
                                <div className="space-y-1">
                                  <Progress
                                    value={fileProgress.progress}
                                    className="h-1.5"
                                  />
                                  <div className="flex items-center gap-2">
                                    {isUploading && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => pauseUpload(file.name)}
                                      >
                                        Pause
                                      </Button>
                                    )}
                                    {isPaused && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => resumeUpload(file)}
                                      >
                                        Resume
                                      </Button>
                                    )}
                                    {isFailed && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => retryFailed(file)}
                                      >
                                        Retry
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCompleted}
                    disabled={!Object.values(progress).some((p) => p.status === 'completed')}
                  >
                    Clear Completed
                  </Button>
                </div>

                {!autoUpload && (
                  <Button
                    onClick={handleUploadAll}
                    disabled={isUploading || files.length === 0}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="me-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      `Upload ${files.length} ${files.length === 1 ? 'file' : 'files'}`
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duplicate File Dialog */}
      <AlertDialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duplicate File Detected</AlertDialogTitle>
            <AlertDialogDescription>
              A file with the same content already exists in your library. Would you like to use
              the existing file or upload a new copy?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Use Existing</AlertDialogCancel>
            <AlertDialogAction onClick={() => duplicateFile && uploadFile(duplicateFile, (category || 'OTHER') as any)}>
              Upload Copy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}