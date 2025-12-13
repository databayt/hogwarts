/**
 * Chunked Upload Hook
 * Handles large file uploads with chunking, progress tracking, and retry logic
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  initiateChunkedUpload,
  uploadChunk,
  completeChunkedUpload,
} from './chunked-actions';
import { uploadFile as uploadFileBasic } from './actions';
import type { FileCategory } from '@prisma/client';

interface ChunkedUploadOptions {
  chunkSize?: number; // Default 5MB
  maxRetries?: number; // Default 3
  retryDelay?: number; // Default 1000ms
  onProgress?: (filename: string, progress: number) => void;
  onSuccess?: (fileId: string) => void;
  onError?: (error: string) => void;
}

interface UploadProgress {
  [filename: string]: {
    progress: number;
    speed: number; // bytes per second
    eta: number; // seconds remaining
    status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
    error?: string;
  };
}

export function useChunkedUpload(options: ChunkedUploadOptions = {}) {
  const {
    chunkSize = 5 * 1024 * 1024, // 5MB
    maxRetries = 3,
    retryDelay = 1000,
    onProgress,
    onSuccess,
    onError,
  } = options;

  const [progress, setProgress] = useState<UploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const abortControllers = useRef<Map<string, AbortController>>(new Map());

  const calculateHash = useCallback(async (data: ArrayBuffer): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }, []);

  const uploadWithRetry = useCallback(
    async (
      uploadFn: () => Promise<any>,
      retries = 0
    ): Promise<any> => {
      try {
        return await uploadFn();
      } catch (error) {
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, retries)));
          return uploadWithRetry(uploadFn, retries + 1);
        }
        throw error;
      }
    },
    [maxRetries, retryDelay]
  );

  const uploadSingleChunk = useCallback(
    async (
      uploadId: string,
      chunk: ArrayBuffer,
      chunkNumber: number,
      _totalChunks: number
    ): Promise<void> => {
      const hash = await calculateHash(chunk);
      const chunkData = btoa(String.fromCharCode(...new Uint8Array(chunk)));

      await uploadWithRetry(() =>
        uploadChunk({
          uploadId,
          chunkNumber,
          chunkData,
          chunkHash: hash,
        })
      );
    },
    [calculateHash, uploadWithRetry]
  );

  const uploadFile = useCallback(
    async (file: File, _category: FileCategory = 'OTHER') => {
      const filename = file.name;
      const startTime = Date.now();
      let uploadedBytes = 0;

      // Initialize progress
      setProgress(prev => ({
        ...prev,
        [filename]: {
          progress: 0,
          speed: 0,
          eta: 0,
          status: 'uploading',
        },
      }));

      try {
        // For small files, use direct upload
        if (file.size <= chunkSize) {
          const formData = new FormData();
          formData.append('file', file);

          const result = await uploadFileBasic(formData, {
            folder: 'uploads',
            category: 'document',
          });

          if (result.success) {
            setProgress(prev => ({
              ...prev,
              [filename]: {
                progress: 100,
                speed: 0,
                eta: 0,
                status: 'completed',
              },
            }));
            if (result.id) {
              onSuccess?.(result.id);
            }
          } else {
            throw new Error(result.error);
          }
          return result;
        }

        // For large files, use chunked upload
        const totalChunks = Math.ceil(file.size / chunkSize);

        // Calculate file hash
        const fileBuffer = await file.arrayBuffer();
        const finalHash = await calculateHash(fileBuffer);

        // Initiate chunked upload session
        const initResult = await initiateChunkedUpload({
          filename: file.name,
          mimeType: file.type,
          totalSize: file.size,
          totalChunks,
        });

        if (!initResult.success || !initResult.uploadId || !initResult.sessionId) {
          throw new Error(initResult.error || 'Invalid chunked upload response');
        }

        const uploadId: string = initResult.uploadId;

        // Create abort controller for this upload
        const abortController = new AbortController();
        abortControllers.current.set(filename, abortController);

        // Upload chunks in parallel (max 3 concurrent)
        const maxConcurrent = 3;
        const chunks: Promise<void>[] = [];

        for (let i = 0; i < totalChunks; i++) {
          if (abortController.signal.aborted) {
            throw new Error('Upload cancelled');
          }

          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = await file.slice(start, end).arrayBuffer();

          const chunkPromise = uploadSingleChunk(uploadId, chunk, i + 1, totalChunks)
            .then(() => {
              uploadedBytes += end - start;

              // Calculate progress, speed, and ETA
              const elapsedTime = (Date.now() - startTime) / 1000; // seconds
              const speed = uploadedBytes / elapsedTime; // bytes per second
              const remainingBytes = file.size - uploadedBytes;
              const eta = speed > 0 ? remainingBytes / speed : 0;
              const progressPercent = (uploadedBytes / file.size) * 100;

              setProgress(prev => ({
                ...prev,
                [filename]: {
                  progress: progressPercent,
                  speed,
                  eta,
                  status: 'uploading',
                },
              }));

              onProgress?.(filename, progressPercent);
            });

          chunks.push(chunkPromise);

          // Wait if we've reached max concurrent uploads
          if (chunks.length >= maxConcurrent || i === totalChunks - 1) {
            await Promise.all(chunks);
            chunks.length = 0;
          }
        }

        // Complete the chunked upload
        const completeResult = await completeChunkedUpload({
          uploadId,
          finalHash,
        });

        if (!completeResult.success) {
          throw new Error(completeResult.error || 'Failed to complete upload');
        }

        // Mark as completed
        setProgress(prev => ({
          ...prev,
          [filename]: {
            progress: 100,
            speed: 0,
            eta: 0,
            status: 'completed',
          },
        }));

        if (completeResult.fileId) {
          onSuccess?.(completeResult.fileId);
        }
        toast.success(`${filename} uploaded successfully`);

        return { success: true, fileId: completeResult.fileId, url: completeResult.url };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';

        setProgress(prev => ({
          ...prev,
          [filename]: {
            ...prev[filename],
            status: 'failed',
            error: errorMessage,
          },
        }));

        onError?.(errorMessage);
        toast.error(`Failed to upload ${filename}: ${errorMessage}`);

        return { success: false, error: errorMessage };
      } finally {
        // Clean up abort controller
        abortControllers.current.delete(filename);
      }
    },
    [chunkSize, onProgress, onSuccess, onError, uploadSingleChunk, calculateHash]
  );

  const uploadMultiple = useCallback(
    async (files: File[], category: FileCategory = 'OTHER') => {
      setIsUploading(true);

      const results = [];
      for (const file of files) {
        const result = await uploadFile(file, category);
        results.push(result);
      }

      setIsUploading(false);
      return results;
    },
    [uploadFile]
  );

  const pauseUpload = useCallback((filename: string) => {
    const controller = abortControllers.current.get(filename);
    if (controller) {
      controller.abort();
      setProgress(prev => ({
        ...prev,
        [filename]: {
          ...prev[filename],
          status: 'paused',
        },
      }));
    }
  }, []);

  const resumeUpload = useCallback(
    async (file: File) => {
      // Resume from where it left off
      // This would require storing chunk progress in the database
      // For now, restart the upload
      await uploadFile(file);
    },
    [uploadFile]
  );

  const cancelUpload = useCallback((filename: string) => {
    const controller = abortControllers.current.get(filename);
    if (controller) {
      controller.abort();
      abortControllers.current.delete(filename);
      setProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[filename];
        return newProgress;
      });
    }
  }, []);

  const clearCompleted = useCallback(() => {
    setProgress(prev => {
      const newProgress = { ...prev };
      Object.keys(newProgress).forEach(key => {
        if (newProgress[key].status === 'completed') {
          delete newProgress[key];
        }
      });
      return newProgress;
    });
  }, []);

  const retryFailed = useCallback(
    async (file: File) => {
      const filename = file.name;
      if (progress[filename]?.status === 'failed') {
        setProgress(prev => ({
          ...prev,
          [filename]: {
            ...prev[filename],
            status: 'pending',
            error: undefined,
          },
        }));
        await uploadFile(file);
      }
    },
    [progress, uploadFile]
  );

  return {
    uploadFile,
    uploadMultiple,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryFailed,
    clearCompleted,
    progress,
    isUploading,
  };
}

// ============================================================================
// Helper Functions for Upload Progress Display
// ============================================================================

export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) {
    return `${bytesPerSecond.toFixed(0)} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
}

export function formatETA(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s`;
  } else if (seconds < 3600) {
    return `${Math.ceil(seconds / 60)}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.ceil((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

// ============================================================================
// Type Exports
// ============================================================================

export type { ChunkedUploadOptions, UploadProgress };
