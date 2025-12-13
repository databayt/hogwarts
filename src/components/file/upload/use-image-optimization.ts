/**
 * Image Optimization Hook
 * Client-side image optimization before upload
 */

'use client';

import { useState, useCallback } from 'react';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  maintainAspectRatio?: boolean;
}

interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  reduction: number; // percentage
  width: number;
  height: number;
}

export function useImageOptimization(defaultOptions: ImageOptimizationOptions = {}) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lastResult, setLastResult] = useState<OptimizationResult | null>(null);

  const calculateDimensions = useCallback((
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } => {
    if (!maintainAspectRatio) {
      return {
        width: Math.min(originalWidth, maxWidth),
        height: Math.min(originalHeight, maxHeight),
      };
    }

    const aspectRatio = originalWidth / originalHeight;

    // Calculate dimensions maintaining aspect ratio
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = maxWidth / aspectRatio;
    }

    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }, []);

  const optimizeImage = useCallback(
    async (
      file: File,
      options: ImageOptimizationOptions = {}
    ): Promise<File> => {
      // Merge with default options
      const finalOptions = {
        maxWidth: options.maxWidth ?? defaultOptions.maxWidth ?? 2048,
        maxHeight: options.maxHeight ?? defaultOptions.maxHeight ?? 2048,
        quality: options.quality ?? defaultOptions.quality ?? 0.85,
        format: options.format ?? defaultOptions.format ?? 'webp',
        maintainAspectRatio:
          options.maintainAspectRatio ?? defaultOptions.maintainAspectRatio ?? true,
      };

      // Skip optimization for non-images
      if (!file.type.startsWith('image/')) {
        return file;
      }

      // Skip optimization for already small files (< 100KB)
      if (file.size < 100 * 1024 && file.type === `image/${finalOptions.format}`) {
        return file;
      }

      setIsOptimizing(true);

      try {
        // Create image bitmap for processing
        const imageBitmap = await createImageBitmap(file);

        // Calculate new dimensions
        const { width, height } = calculateDimensions(
          imageBitmap.width,
          imageBitmap.height,
          finalOptions.maxWidth,
          finalOptions.maxHeight,
          finalOptions.maintainAspectRatio
        );

        // Create canvas for image manipulation
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Apply image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the image
        ctx.drawImage(imageBitmap, 0, 0, width, height);

        // Convert to blob with specified format and quality
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            `image/${finalOptions.format}`,
            finalOptions.quality
          );
        });

        // Create new file with optimized content
        const extension = finalOptions.format;
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        const optimizedFile = new File(
          [blob],
          `${nameWithoutExt}.${extension}`,
          { type: `image/${finalOptions.format}` }
        );

        // Calculate optimization result
        const reduction = ((file.size - optimizedFile.size) / file.size) * 100;

        setLastResult({
          originalSize: file.size,
          optimizedSize: optimizedFile.size,
          reduction,
          width,
          height,
        });

        // Clean up
        imageBitmap.close();

        return optimizedFile;
      } finally {
        setIsOptimizing(false);
      }
    },
    [defaultOptions, calculateDimensions]
  );

  const optimizeMultiple = useCallback(
    async (
      files: File[],
      options: ImageOptimizationOptions = {}
    ): Promise<File[]> => {
      const results: File[] = [];

      for (const file of files) {
        try {
          const optimized = await optimizeImage(file, options);
          results.push(optimized);
        } catch (error) {
          console.error(`Failed to optimize ${file.name}:`, error);
          // If optimization fails, use original file
          results.push(file);
        }
      }

      return results;
    },
    [optimizeImage]
  );

  const generateThumbnail = useCallback(
    async (
      file: File,
      thumbnailSize: number = 200
    ): Promise<string> => {
      if (!file.type.startsWith('image/')) {
        throw new Error('File is not an image');
      }

      const imageBitmap = await createImageBitmap(file);

      // Calculate thumbnail dimensions maintaining aspect ratio
      const aspectRatio = imageBitmap.width / imageBitmap.height;
      let width = thumbnailSize;
      let height = thumbnailSize;

      if (aspectRatio > 1) {
        height = thumbnailSize / aspectRatio;
      } else {
        width = thumbnailSize * aspectRatio;
      }

      // Create canvas for thumbnail
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(imageBitmap, 0, 0, width, height);

      // Clean up
      imageBitmap.close();

      // Return data URL for preview
      return canvas.toDataURL('image/jpeg', 0.8);
    },
    []
  );

  const extractImageMetadata = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return null;
    }

    try {
      const imageBitmap = await createImageBitmap(file);
      const metadata = {
        width: imageBitmap.width,
        height: imageBitmap.height,
        aspectRatio: imageBitmap.width / imageBitmap.height,
        megapixels: (imageBitmap.width * imageBitmap.height) / 1000000,
      };
      imageBitmap.close();
      return metadata;
    } catch (error) {
      console.error('Failed to extract image metadata:', error);
      return null;
    }
  }, []);

  const canOptimize = useCallback((file: File): boolean => {
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      return false;
    }

    // Check if file size is worth optimizing (> 100KB)
    if (file.size < 100 * 1024) {
      return false;
    }

    // Check supported formats
    const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp'];
    return supportedFormats.includes(file.type);
  }, []);

  const estimateOptimizedSize = useCallback(
    (
      originalSize: number,
      format: 'webp' | 'jpeg' | 'png' = 'webp',
      quality: number = 0.85
    ): number => {
      // Rough estimation based on format and quality
      let compressionRatio = 1;

      switch (format) {
        case 'webp':
          compressionRatio = 0.3 + (1 - quality) * 0.4; // WebP typically 30-70% of original
          break;
        case 'jpeg':
          compressionRatio = 0.4 + (1 - quality) * 0.3; // JPEG typically 40-70% of original
          break;
        case 'png':
          compressionRatio = 0.8; // PNG compression is lossless, less reduction
          break;
      }

      return Math.round(originalSize * compressionRatio);
    },
    []
  );

  return {
    optimizeImage,
    optimizeMultiple,
    generateThumbnail,
    extractImageMetadata,
    canOptimize,
    estimateOptimizedSize,
    isOptimizing,
    lastResult,
  };
}

// ============================================================================
// Image Format Detection Utilities
// ============================================================================

export function detectImageFormat(file: File): string | null {
  // Read first 8 bytes of file for signature detection
  // This would need to be async in real implementation
  return file.type.split('/')[1] || null;
}

export function supportsWebP(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.fillStyle = 'red';
  ctx.fillRect(0, 0, 1, 1);
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
}

export function supportsAVIF(): boolean {
  // Check AVIF support
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  return canvas.toDataURL('image/avif').indexOf('image/avif') === 5;
}
