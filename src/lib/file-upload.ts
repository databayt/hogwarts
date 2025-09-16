/**
 * File Upload Service
 * Handles file uploads for logos, avatars, and other assets
 */

import { logger } from '@/lib/logger';
import { performanceMonitor } from '@/lib/performance-monitor';

export interface UploadConfig {
  maxSize: number; // in bytes
  allowedTypes: string[];
  directory: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  metadata?: {
    size: number;
    type: string;
    dimensions?: { width: number; height: number };
  };
}

class FileUploadService {
  private readonly logoConfig: UploadConfig = {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
    directory: 'logos',
  };

  private readonly avatarConfig: UploadConfig = {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    directory: 'avatars',
  };

  /**
   * Validate file before upload
   */
  private validateFile(file: File, config: UploadConfig): { valid: boolean; error?: string } {
    // Check file size
    if (file.size > config.maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${config.maxSize / (1024 * 1024)}MB limit`,
      };
    }

    // Check file type
    if (!config.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`,
      };
    }

    return { valid: true };
  }

  /**
   * Upload logo file
   */
  async uploadLogo(file: File, schoolId: string): Promise<UploadResult> {
    const startTime = performance.now();

    try {
      // Validate file
      const validation = this.validateFile(file, this.logoConfig);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${schoolId}_${timestamp}_${sanitizedName}`;

      // Convert file to base64 for storage
      // In production, you'd upload to a CDN like Cloudinary or AWS S3
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      // Get image dimensions if it's an image
      let dimensions;
      if (file.type.startsWith('image/')) {
        dimensions = await this.getImageDimensions(dataUrl);
      }

      // In production, upload to CDN here
      // const cdnUrl = await this.uploadToCDN(file, filename);

      // For now, we'll store as data URL (not recommended for production)
      const url = dataUrl;

      performanceMonitor.recordMetric('logo_upload', performance.now() - startTime, 'ms', {
        schoolId,
        fileSize: file.size,
        fileType: file.type,
      });

      logger.info('Logo uploaded successfully', {
        action: 'logo_upload',
        schoolId,
        filename,
        size: file.size,
        type: file.type,
        dimensions,
      });

      return {
        success: true,
        url,
        metadata: {
          size: file.size,
          type: file.type,
          dimensions,
        },
      };
    } catch (error) {
      logger.error('Logo upload failed', error instanceof Error ? error : new Error('Unknown error'), {
        action: 'logo_upload_error',
        schoolId,
      });

      return {
        success: false,
        error: 'Failed to upload logo',
      };
    }
  }

  /**
   * Upload avatar file
   */
  async uploadAvatar(file: File, userId: string): Promise<UploadResult> {
    const startTime = performance.now();

    try {
      // Validate file
      const validation = this.validateFile(file, this.avatarConfig);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate unique filename
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${userId}_${timestamp}_${sanitizedName}`;

      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;

      // Get image dimensions
      const dimensions = await this.getImageDimensions(dataUrl);

      // In production, upload to CDN
      const url = dataUrl;

      performanceMonitor.recordMetric('avatar_upload', performance.now() - startTime, 'ms', {
        userId,
        fileSize: file.size,
        fileType: file.type,
      });

      logger.info('Avatar uploaded successfully', {
        action: 'avatar_upload',
        userId,
        filename,
        size: file.size,
        type: file.type,
        dimensions,
      });

      return {
        success: true,
        url,
        metadata: {
          size: file.size,
          type: file.type,
          dimensions,
        },
      };
    } catch (error) {
      logger.error('Avatar upload failed', error instanceof Error ? error : new Error('Unknown error'), {
        action: 'avatar_upload_error',
        userId,
      });

      return {
        success: false,
        error: 'Failed to upload avatar',
      };
    }
  }

  /**
   * Get image dimensions
   */
  private async getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        // Server-side: return default dimensions
        resolve({ width: 0, height: 0 });
        return;
      }

      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        resolve({ width: 0, height: 0 });
      };
      img.src = dataUrl;
    });
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(url: string): Promise<boolean> {
    try {
      // In production, delete from CDN
      logger.info('File deleted', {
        action: 'file_delete',
        url,
      });
      return true;
    } catch (error) {
      logger.error('File deletion failed', error instanceof Error ? error : new Error('Unknown error'), {
        action: 'file_delete_error',
        url,
      });
      return false;
    }
  }

  /**
   * Optimize image
   */
  async optimizeImage(file: File): Promise<File> {
    // In production, use sharp or imagemin to optimize
    // For now, return the original file
    return file;
  }
}

// Export singleton instance
export const fileUploadService = new FileUploadService();

// Export convenience functions
export const uploadLogo = (file: File, schoolId: string) => fileUploadService.uploadLogo(file, schoolId);
export const uploadAvatar = (file: File, userId: string) => fileUploadService.uploadAvatar(file, userId);
export const deleteFile = (url: string) => fileUploadService.deleteFile(url);