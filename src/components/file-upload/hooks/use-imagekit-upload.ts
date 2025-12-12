/**
 * ImageKit Upload Hook
 *
 * Client-side hook for uploading files directly to ImageKit CDN.
 * Supports progress tracking, error handling, and authenticated uploads.
 */

"use client";

import { useState, useCallback } from "react";
import { IMAGEKIT_FOLDERS } from "@/lib/imagekit";

// ============================================================================
// Types
// ============================================================================

export interface ImageKitAuthParams {
  token: string;
  expire: string;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  filePath: string;
  size: number;
  fileType: string;
  height?: number;
  width?: number;
}

export interface UseImageKitUploadOptions {
  /** Folder path for uploads */
  folder?: string;
  /** Callback on successful upload */
  onSuccess?: (result: UploadResult) => void;
  /** Callback on upload error */
  onError?: (error: string) => void;
  /** Callback on progress update */
  onProgress?: (progress: UploadProgress) => void;
}

export interface UseImageKitUploadReturn {
  /** Upload a single file */
  upload: (file: File) => Promise<UploadResult | null>;
  /** Upload via server-side API */
  uploadViaServer: (file: File) => Promise<UploadResult | null>;
  /** Current upload progress (0-100) */
  progress: number;
  /** Whether upload is in progress */
  isUploading: boolean;
  /** Current error message */
  error: string | null;
  /** Reset error state */
  resetError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useImageKitUpload(
  options: UseImageKitUploadOptions = {}
): UseImageKitUploadReturn {
  const {
    folder = IMAGEKIT_FOLDERS.LIBRARY_BOOKS,
    onSuccess,
    onError,
    onProgress,
  } = options;

  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get authentication parameters from the server
   */
  const getAuthParams = useCallback(async (): Promise<ImageKitAuthParams | null> => {
    try {
      const response = await fetch("/api/upload/imagekit");
      if (!response.ok) {
        throw new Error("Failed to get authentication");
      }
      return response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      setError(message);
      onError?.(message);
      return null;
    }
  }, [onError]);

  /**
   * Convert File to base64 string
   */
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }, []);

  /**
   * Upload file directly to ImageKit (client-side)
   * Uses authenticated upload with signature
   */
  const upload = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Get auth params
        const authParams = await getAuthParams();
        if (!authParams) {
          setIsUploading(false);
          return null;
        }

        // Prepare form data for ImageKit upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("folder", folder);
        formData.append("publicKey", authParams.publicKey);
        formData.append("signature", authParams.signature);
        formData.append("expire", authParams.expire);
        formData.append("token", authParams.token);
        formData.append("useUniqueFileName", "true");

        // Upload with progress tracking
        const result = await new Promise<UploadResult>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const percentage = Math.round((event.loaded / event.total) * 100);
              setProgress(percentage);
              onProgress?.({
                loaded: event.loaded,
                total: event.total,
                percentage,
              });
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              resolve({
                fileId: response.fileId,
                name: response.name,
                url: response.url,
                thumbnailUrl: response.thumbnailUrl,
                filePath: response.filePath,
                size: response.size,
                fileType: response.fileType,
                height: response.height,
                width: response.width,
              });
            } else {
              let errorMessage = "Upload failed";
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                errorMessage = errorResponse.message || errorMessage;
              } catch {
                // Use default error message
              }
              reject(new Error(errorMessage));
            }
          });

          xhr.addEventListener("error", () => {
            reject(new Error("Network error during upload"));
          });

          xhr.open("POST", "https://upload.imagekit.io/api/v1/files/upload");
          xhr.send(formData);
        });

        setProgress(100);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [folder, getAuthParams, onSuccess, onError, onProgress]
  );

  /**
   * Upload file via server-side API
   * Use this when you need server-side processing or validation
   */
  const uploadViaServer = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // Convert file to base64
        setProgress(10);
        const base64 = await fileToBase64(file);
        setProgress(30);

        // Upload via server API
        const response = await fetch("/api/upload/imagekit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: `data:${file.type};base64,${base64}`,
            fileName: file.name,
            folder,
          }),
        });

        setProgress(80);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Upload failed");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Upload failed");
        }

        setProgress(100);
        onSuccess?.(data.data);
        return data.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        onError?.(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [folder, fileToBase64, onSuccess, onError]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    upload,
    uploadViaServer,
    progress,
    isUploading,
    error,
    resetError,
  };
}

// ============================================================================
// Export folder constants for convenience
// ============================================================================

export { IMAGEKIT_FOLDERS };
