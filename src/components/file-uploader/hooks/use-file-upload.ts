/**
 * useFileUpload Hook
 * Core hook for file upload functionality
 */

'use client';

import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type {
  UseFileUploadReturn,
  UploadResult,
  BatchUploadResult,
  UploadConfig,
  FileCategory,
} from '../types';
import { uploadFileAction } from '../actions';
import { toast } from 'sonner';

interface UseFileUploadOptions extends UploadConfig {
  schoolId?: string;
  folder?: string;
  category: FileCategory;
  onSuccess?: (result: UploadResult) => void;
  onError?: (error: Error) => void;
}

export function useFileUpload(options: UseFileUploadOptions): UseFileUploadReturn {
  const { data: session } = useSession();
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!session?.user) {
        const error = new Error('You must be logged in to upload files');
        setError(error);
        options.onError?.(error);
        return { success: false, error: error.message };
      }

      const schoolId = options.schoolId || session.user.schoolId;
      if (!schoolId) {
        const error = new Error('School context required');
        setError(error);
        options.onError?.(error);
        return { success: false, error: error.message };
      }

      try {
        setIsUploading(true);
        setError(null);
        setProgress((prev) => ({ ...prev, [file.name]: 0 }));

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', options.folder || `${schoolId}/uploads`);
        formData.append('category', options.category);
        if (options.type) {
          formData.append('type', options.type);
        }
        if (options.metadata) {
          formData.append('metadata', JSON.stringify(options.metadata));
        }

        // Simulate progress (real progress tracking would require streaming)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            const current = prev[file.name] || 0;
            if (current >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [file.name]: current + 10 };
          });
        }, 200);

        // Upload file
        const result = await uploadFileAction(formData);

        clearInterval(progressInterval);
        setProgress((prev) => ({ ...prev, [file.name]: 100 }));

        if (result.success) {
          options.onSuccess?.(result);
          toast.success('File uploaded successfully');
        } else {
          const error = new Error(result.error || 'Upload failed');
          setError(error);
          options.onError?.(error);
          toast.error(result.error || 'Upload failed');
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Upload failed');
        setError(error);
        options.onError?.(error);
        toast.error(error.message);

        return {
          success: false,
          error: error.message,
        };
      } finally {
        setIsUploading(false);
      }
    },
    [session, options]
  );

  const uploadMultiple = useCallback(
    async (files: File[]) => {
      const results: UploadResult[] = [];
      let succeeded = 0;
      let failed = 0;

      for (const file of files) {
        const result = await upload(file);
        results.push(result);

        if (result.success) {
          succeeded++;
        } else {
          failed++;
        }
      }

      return {
        success: failed === 0,
        results,
        succeeded,
        failed,
      } as BatchUploadResult;
    },
    [upload]
  );

  const reset = useCallback(() => {
    setProgress({});
    setError(null);
    setIsUploading(false);
  }, []);

  return {
    upload,
    uploadMultiple,
    progress,
    isUploading,
    error,
    reset,
  };
}
