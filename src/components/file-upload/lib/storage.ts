/**
 * Unified Storage Service
 * Central service for file uploads following LMS best practices
 */

import type {
  FileCategory,
  FileMetadata,
  UploadOptions,
  UploadResult,
  BatchUploadResult,
  StorageProvider,
} from '../types';
import { getStorageProvider } from '../config/storage-config';
import { uploadToProvider, deleteFromProvider } from './providers';
import { generateUniqueFilename } from './formatters';
import { detectCategory } from '../config/file-types';
import { validateFileComprehensive } from './validation';
import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance-monitor';

// ============================================================================
// Storage Service Class
// ============================================================================

class StorageService {
  /**
   * Upload a single file
   */
  async uploadFile(
    file: File,
    options: UploadOptions
  ): Promise<UploadResult> {
    const startTime = performance.now();

    try {
      // 1. Validate file
      const category = options.category || detectCategory(file.type);
      const validationRules = {
        maxSize: options.maxSize,
        allowedTypes: options.accept
          ? Object.keys(options.accept)
          : undefined,
      };

      const validation = await validateFileComprehensive(
        file,
        validationRules,
        category
      );

      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', '),
        };
      }

      // 2. Determine storage provider
      const providerConfig = getStorageProvider(
        category,
        file.size,
        options.folder
      );

      // 3. Generate file path
      const filename = generateUniqueFilename(file.name, options.schoolId);
      const folderPath = options.folder || `${options.schoolId}/uploads`;
      const fullPath = `${folderPath}/${filename}`;

      // 4. Upload to provider
      options.onProgress?.(10);
      const url = await uploadToProvider(
        file,
        fullPath,
        providerConfig.provider
      );
      options.onProgress?.(90);

      // 5. Create metadata
      const metadata: FileMetadata = {
        id: this.generateId(),
        filename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        category,
        type: options.type,
        url,
        pathname: fullPath,
        uploadedAt: new Date(),
        uploadedBy: options.userId,
        schoolId: options.schoolId,
        folder: folderPath,
        storageProvider: providerConfig.provider,
        storageTier: providerConfig.tier,
        metadata: options.metadata,
      };

      options.onProgress?.(100);

      // 6. Log upload
      performanceMonitor.recordMetric(
        'file_upload',
        performance.now() - startTime,
        'ms',
        {
          schoolId: options.schoolId,
          category,
          size: file.size,
          provider: providerConfig.provider,
        }
      );

      logger.info('File uploaded successfully', {
        action: 'file_upload',
        schoolId: options.schoolId,
        filename,
        size: file.size,
        category,
        provider: providerConfig.provider,
      });

      options.onSuccess?.(metadata);

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Upload failed';

      logger.error(
        'File upload failed',
        error instanceof Error ? error : new Error(errorMessage),
        {
          action: 'file_upload_error',
          schoolId: options.schoolId,
          filename: file.name,
        }
      );

      options.onError?.(error instanceof Error ? error : new Error(errorMessage));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[],
    options: UploadOptions
  ): Promise<BatchUploadResult> {
    const results: UploadResult[] = [];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Update progress for batch
      const batchProgress = (i / files.length) * 100;
      options.onProgress?.(batchProgress);

      const result = await this.uploadFile(file, {
        ...options,
        onProgress: undefined, // Individual progress handled by batch
      });

      results.push(result);

      if (result.success) {
        succeeded++;
      } else {
        failed++;
      }
    }

    options.onProgress?.(100);

    return {
      success: failed === 0,
      results,
      succeeded,
      failed,
    };
  }

  /**
   * Delete a file
   */
  async deleteFile(
    url: string,
    provider: StorageProvider,
    schoolId: string
  ): Promise<boolean> {
    try {
      const success = await deleteFromProvider(url, provider);

      if (success) {
        logger.info('File deleted successfully', {
          action: 'file_delete',
          schoolId,
          url,
        });
      }

      return success;
    } catch (error) {
      logger.error(
        'File deletion failed',
        error instanceof Error ? error : new Error('Unknown error'),
        {
          action: 'file_delete_error',
          schoolId,
          url,
        }
      );

      return false;
    }
  }

  /**
   * Get file URL (for signed URLs in the future)
   */
  getFileUrl(pathname: string, provider: StorageProvider): string {
    // For now, just return the pathname
    // In the future, this could generate signed URLs for private files
    return pathname;
  }

  /**
   * Generate unique ID for metadata
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const storageService = new StorageService();

// ============================================================================
// Convenience Exports
// ============================================================================

export const uploadFile = (file: File, options: UploadOptions) =>
  storageService.uploadFile(file, options);

export const uploadMultiple = (files: File[], options: UploadOptions) =>
  storageService.uploadMultiple(files, options);

export const deleteFile = (url: string, provider: StorageProvider, schoolId: string) =>
  storageService.deleteFile(url, provider, schoolId);

export const getFileUrl = (pathname: string, provider: StorageProvider) =>
  storageService.getFileUrl(pathname, provider);
