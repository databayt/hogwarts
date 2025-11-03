/**
 * useFileProgress Hook
 * Manages upload progress tracking for multiple files
 */

'use client';

import { useState, useCallback } from 'react';
import type { UseFileProgressReturn, UploadProgress } from '../types';

export function useFileProgress(): UseFileProgressReturn {
  const [progress, setProgress] = useState<UploadProgress>({});

  const setProgressForFile = useCallback((fileId: string, value: number) => {
    setProgress((prev) => ({
      ...prev,
      [fileId]: Math.min(100, Math.max(0, value)),
    }));
  }, []);

  const resetProgress = useCallback((fileId?: string) => {
    if (fileId) {
      setProgress((prev) => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
    } else {
      setProgress({});
    }
  }, []);

  return {
    progress,
    setProgress: setProgressForFile,
    resetProgress,
  };
}
