/**
 * File Upload Formatters
 * Utility functions for formatting file sizes, types, durations, etc.
 */

import type { FileCategory } from '../types';
import { detectCategory, getFileExtension } from '../config/file-types';

// ============================================================================
// File Size Formatting
// ============================================================================

/**
 * Format bytes to human-readable string
 * @example formatBytes(1024) // "1 KB"
 * @example formatBytes(1536, 2) // "1.50 KB"
 */
export function formatBytes(
  bytes: number,
  decimals: number = 2
): string {
  if (bytes === 0) return '0 Bytes';
  if (bytes < 0) return 'Invalid size';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));

  return `${size} ${sizes[i]}`;
}

/**
 * Format bytes to compact string (for UI where space is limited)
 * @example formatBytesCompact(1536) // "1.5K"
 */
export function formatBytesCompact(bytes: number): string {
  if (bytes === 0) return '0B';
  if (bytes < 0) return 'N/A';

  const k = 1024;
  const sizes = ['B', 'K', 'M', 'G', 'T'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));

  return `${size}${sizes[i]}`;
}

/**
 * Parse human-readable size to bytes
 * @example parseSize("1.5 MB") // 1572864
 */
export function parseSize(sizeStr: string): number {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^([\d.]+)\s*([A-Z]+)$/i);
  if (!match) return 0;

  const [, value, unit] = match;
  const multiplier = units[unit.toUpperCase()] || 1;

  return parseFloat(value) * multiplier;
}

// ============================================================================
// Duration Formatting
// ============================================================================

/**
 * Format seconds to human-readable duration
 * @example formatDuration(90) // "1:30"
 * @example formatDuration(3665) // "1:01:05"
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) return '0:00';
  if (!isFinite(seconds)) return '∞';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to long form
 * @example formatDurationLong(90) // "1 minute 30 seconds"
 * @example formatDurationLong(3665) // "1 hour 1 minute 5 seconds"
 */
export function formatDurationLong(seconds: number): string {
  if (seconds < 0) return '0 seconds';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }

  if (minutes > 0) {
    parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  }

  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs} ${secs === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' ');
}

// ============================================================================
// File Name Formatting
// ============================================================================

/**
 * Sanitize filename for safe storage
 * Removes special characters and ensures valid filename
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  let sanitized = filename.replace(/[/\\:*?"<>|]/g, '_');

  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Remove leading/trailing spaces and dots
  sanitized = sanitized.trim().replace(/^\.+|\.+$/g, '');

  // Ensure filename is not empty
  if (!sanitized) {
    sanitized = 'file';
  }

  return sanitized;
}

/**
 * Generate unique filename with timestamp
 */
export function generateUniqueFilename(
  originalName: string,
  prefix?: string
): string {
  const sanitized = sanitizeFilename(originalName);
  const extension = getFileExtension(sanitized);
  const nameWithoutExt = sanitized.slice(0, -extension.length);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);

  const parts = [prefix, nameWithoutExt, timestamp, random]
    .filter(Boolean)
    .join('_');

  return `${parts}${extension}`;
}

/**
 * Truncate filename for display
 */
export function truncateFilename(
  filename: string,
  maxLength: number = 30
): string {
  if (filename.length <= maxLength) return filename;

  const extension = getFileExtension(filename);
  const nameWithoutExt = filename.slice(0, -extension.length);

  // Keep extension visible
  const availableLength = maxLength - extension.length - 3; // 3 for '...'

  if (availableLength < 5) {
    // If too short, just show extension
    return `...${extension}`;
  }

  return `${nameWithoutExt.slice(0, availableLength)}...${extension}`;
}

// ============================================================================
// MIME Type Formatting
// ============================================================================

/**
 * Get human-readable file type from MIME type
 */
export function getFileTypeLabel(mimeType: string): string {
  const labels: Record<string, string> = {
    // Images
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/svg+xml': 'SVG Image',
    'image/webp': 'WebP Image',

    // Videos
    'video/mp4': 'MP4 Video',
    'video/webm': 'WebM Video',
    'video/quicktime': 'MOV Video',
    'video/x-msvideo': 'AVI Video',

    // Documents
    'application/pdf': 'PDF Document',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      'Word Document',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      'Excel Spreadsheet',
    'application/vnd.ms-powerpoint': 'PowerPoint Presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      'PowerPoint Presentation',
    'text/plain': 'Text File',

    // Archives
    'application/zip': 'ZIP Archive',
    'application/x-rar-compressed': 'RAR Archive',
    'application/x-7z-compressed': '7-Zip Archive',
  };

  return labels[mimeType] || mimeType;
}

/**
 * Get file category label
 */
export function getCategoryLabel(category: FileCategory): string {
  const labels: Record<FileCategory, string> = {
    image: 'Image',
    video: 'Video',
    document: 'Document',
    audio: 'Audio',
    archive: 'Archive',
    other: 'Other',
  };

  return labels[category];
}

// ============================================================================
// Progress Formatting
// ============================================================================

/**
 * Format upload progress percentage
 */
export function formatProgress(progress: number): string {
  return `${Math.round(progress)}%`;
}

/**
 * Calculate estimated time remaining
 * @param bytesUploaded - Bytes uploaded so far
 * @param totalBytes - Total bytes to upload
 * @param elapsedMs - Milliseconds elapsed since upload started
 */
export function estimateTimeRemaining(
  bytesUploaded: number,
  totalBytes: number,
  elapsedMs: number
): string {
  if (bytesUploaded === 0 || elapsedMs === 0) return 'Calculating...';
  if (bytesUploaded >= totalBytes) return 'Complete';

  const bytesPerMs = bytesUploaded / elapsedMs;
  const remainingBytes = totalBytes - bytesUploaded;
  const remainingMs = remainingBytes / bytesPerMs;
  const remainingSecs = Math.ceil(remainingMs / 1000);

  if (remainingSecs < 60) return `${remainingSecs}s remaining`;
  if (remainingSecs < 3600) {
    const mins = Math.ceil(remainingSecs / 60);
    return `${mins}m remaining`;
  }

  const hours = Math.ceil(remainingSecs / 3600);
  return `${hours}h remaining`;
}

/**
 * Format upload speed
 */
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
  if (bytesPerSecond < 1024 * 1024)
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  if (bytesPerSecond < 1024 * 1024 * 1024)
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;

  return `${(bytesPerSecond / (1024 * 1024 * 1024)).toFixed(1)} GB/s`;
}

// ============================================================================
// Date Formatting
// ============================================================================

/**
 * Format upload date
 */
export function formatUploadDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

// ============================================================================
// Validation Message Formatting
// ============================================================================

/**
 * Format validation error message
 */
export function formatValidationError(
  error: string,
  filename?: string
): string {
  const prefix = filename ? `${truncateFilename(filename)}: ` : '';
  return `${prefix}${error}`;
}

/**
 * Get file type from filename or MIME type
 */
export function getFileType(file: File): {
  category: FileCategory;
  extension: string;
  label: string;
} {
  const extension = getFileExtension(file.name);
  const category = detectCategory(file.type);
  const label = getFileTypeLabel(file.type);

  return { category, extension, label };
}

// ============================================================================
// Export
// ============================================================================

export const formatters = {
  // Size
  formatBytes,
  formatBytesCompact,
  parseSize,

  // Duration
  formatDuration,
  formatDurationLong,

  // Filename
  sanitizeFilename,
  generateUniqueFilename,
  truncateFilename,

  // Type
  getFileTypeLabel,
  getCategoryLabel,
  getFileType,

  // Progress
  formatProgress,
  estimateTimeRemaining,
  formatSpeed,

  // Date
  formatUploadDate,

  // Validation
  formatValidationError,
} as const;
