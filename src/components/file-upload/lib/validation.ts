/**
 * File Upload Validation
 * Comprehensive validation for file uploads with security checks
 */

import type {
  FileCategory,
  ValidationRule,
  ValidationResult,
} from '../types';
import { detectCategory, isMimeTypeAllowed, getFileExtension } from '../config/file-types';
import { formatBytes } from './formatters';

// ============================================================================
// File Validation
// ============================================================================

/**
 * Validate a single file against rules
 */
export function validateFile(
  file: File,
  rules: ValidationRule
): ValidationResult {
  const errors: string[] = [];

  // Size validation
  if (rules.maxSize && file.size > rules.maxSize) {
    errors.push(
      `File size ${formatBytes(file.size)} exceeds maximum ${formatBytes(rules.maxSize)}`
    );
  }

  if (rules.minSize && file.size < rules.minSize) {
    errors.push(
      `File size ${formatBytes(file.size)} is below minimum ${formatBytes(rules.minSize)}`
    );
  }

  // Type validation
  if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
    errors.push(
      `File type ${file.type} is not allowed. Allowed types: ${rules.allowedTypes.join(', ')}`
    );
  }

  // Extension validation
  if (rules.allowedExtensions) {
    const extension = getFileExtension(file.name);
    if (!rules.allowedExtensions.includes(extension)) {
      errors.push(
        `File extension ${extension} is not allowed. Allowed: ${rules.allowedExtensions.join(', ')}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  rules: ValidationRule
): ValidationResult {
  const errors: string[] = [];

  for (const file of files) {
    const result = validateFile(file, rules);
    if (!result.valid) {
      errors.push(...result.errors.map(err => `${file.name}: ${err}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Security Validation
// ============================================================================

/**
 * Check for potentially dangerous file types
 * Prevents upload of executable files and scripts
 */
export function validateSecurity(file: File): ValidationResult {
  const errors: string[] = [];

  // Dangerous extensions
  const dangerousExtensions = [
    '.exe',
    '.bat',
    '.cmd',
    '.com',
    '.scr',
    '.vbs',
    '.js',
    '.jar',
    '.app',
    '.deb',
    '.rpm',
    '.sh',
    '.ps1',
    '.msi',
  ];

  const extension = getFileExtension(file.name).toLowerCase();
  if (dangerousExtensions.includes(extension)) {
    errors.push(
      `File extension ${extension} is not allowed for security reasons`
    );
  }

  // Dangerous MIME types
  const dangerousMimeTypes = [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-sh',
    'application/x-bat',
    'text/javascript',
    'application/javascript',
  ];

  if (dangerousMimeTypes.includes(file.type)) {
    errors.push(
      `File type ${file.type} is not allowed for security reasons`
    );
  }

  // Check for double extensions (e.g., file.pdf.exe)
  const parts = file.name.split('.');
  if (parts.length > 2) {
    const secondToLast = `.${parts[parts.length - 2].toLowerCase()}`;
    if (dangerousExtensions.includes(secondToLast)) {
      errors.push(
        'File has suspicious double extension and cannot be uploaded'
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Image Validation
// ============================================================================

/**
 * Validate image dimensions
 * Note: This runs in the browser using FileReader
 */
export async function validateImageDimensions(
  file: File,
  rules: ValidationRule
): Promise<ValidationResult> {
  const errors: string[] = [];

  if (!file.type.startsWith('image/') || !rules.dimensions) {
    return { valid: true, errors: [] };
  }

  try {
    const dimensions = await getImageDimensions(file);

    if (
      rules.dimensions.maxWidth &&
      dimensions.width > rules.dimensions.maxWidth
    ) {
      errors.push(
        `Image width ${dimensions.width}px exceeds maximum ${rules.dimensions.maxWidth}px`
      );
    }

    if (
      rules.dimensions.maxHeight &&
      dimensions.height > rules.dimensions.maxHeight
    ) {
      errors.push(
        `Image height ${dimensions.height}px exceeds maximum ${rules.dimensions.maxHeight}px`
      );
    }

    if (
      rules.dimensions.minWidth &&
      dimensions.width < rules.dimensions.minWidth
    ) {
      errors.push(
        `Image width ${dimensions.width}px is below minimum ${rules.dimensions.minWidth}px`
      );
    }

    if (
      rules.dimensions.minHeight &&
      dimensions.height < rules.dimensions.minHeight
    ) {
      errors.push(
        `Image height ${dimensions.height}px is below minimum ${rules.dimensions.minHeight}px`
      );
    }

    if (rules.dimensions.aspectRatio) {
      const aspectRatio = dimensions.width / dimensions.height;
      const diff = Math.abs(aspectRatio - rules.dimensions.aspectRatio);
      if (diff > 0.01) {
        // Allow 1% variance
        errors.push(
          `Image aspect ratio ${aspectRatio.toFixed(2)} doesn't match required ${rules.dimensions.aspectRatio}`
        );
      }
    }
  } catch (error) {
    errors.push('Failed to read image dimensions');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

// ============================================================================
// Video Validation
// ============================================================================

/**
 * Validate video duration
 * Note: This runs in the browser using video element
 */
export async function validateVideoDuration(
  file: File,
  rules: ValidationRule
): Promise<ValidationResult> {
  const errors: string[] = [];

  if (!file.type.startsWith('video/') || !rules.duration) {
    return { valid: true, errors: [] };
  }

  try {
    const duration = await getVideoDuration(file);

    if (rules.duration.max && duration > rules.duration.max) {
      errors.push(
        `Video duration ${Math.round(duration)}s exceeds maximum ${rules.duration.max}s`
      );
    }

    if (rules.duration.min && duration < rules.duration.min) {
      errors.push(
        `Video duration ${Math.round(duration)}s is below minimum ${rules.duration.min}s`
      );
    }
  } catch (error) {
    errors.push('Failed to read video duration');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get video duration from file
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };

    video.onerror = () => {
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(file);
  });
}

// ============================================================================
// Category Validation
// ============================================================================

/**
 * Validate file belongs to expected category
 */
export function validateCategory(
  file: File,
  expectedCategory: FileCategory
): ValidationResult {
  const errors: string[] = [];
  const actualCategory = detectCategory(file.type);

  if (actualCategory !== expectedCategory) {
    errors.push(
      `File is ${actualCategory} but ${expectedCategory} was expected`
    );
  }

  if (!isMimeTypeAllowed(file.type, expectedCategory)) {
    errors.push(
      `MIME type ${file.type} is not allowed for ${expectedCategory} files`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Comprehensive Validation
// ============================================================================

/**
 * Run comprehensive validation on a file
 * Includes security, size, type, and category checks
 */
export async function validateFileComprehensive(
  file: File,
  rules: ValidationRule,
  category?: FileCategory
): Promise<ValidationResult> {
  const errors: string[] = [];

  // 1. Security validation
  const securityResult = validateSecurity(file);
  if (!securityResult.valid) {
    errors.push(...securityResult.errors);
  }

  // 2. Basic validation
  const basicResult = validateFile(file, rules);
  if (!basicResult.valid) {
    errors.push(...basicResult.errors);
  }

  // 3. Category validation
  if (category) {
    const categoryResult = validateCategory(file, category);
    if (!categoryResult.valid) {
      errors.push(...categoryResult.errors);
    }
  }

  // 4. Image dimension validation (if applicable)
  if (file.type.startsWith('image/') && rules.dimensions) {
    const dimensionResult = await validateImageDimensions(file, rules);
    if (!dimensionResult.valid) {
      errors.push(...dimensionResult.errors);
    }
  }

  // 5. Video duration validation (if applicable)
  if (file.type.startsWith('video/') && rules.duration) {
    const durationResult = await validateVideoDuration(file, rules);
    if (!durationResult.valid) {
      errors.push(...durationResult.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Batch Validation
// ============================================================================

/**
 * Validate multiple files with comprehensive checks
 */
export async function validateFilesComprehensive(
  files: File[],
  rules: ValidationRule,
  category?: FileCategory
): Promise<ValidationResult> {
  const errors: string[] = [];

  for (const file of files) {
    const result = await validateFileComprehensive(file, rules, category);
    if (!result.valid) {
      errors.push(...result.errors.map(err => `${file.name}: ${err}`));
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if file name is valid
 */
export function isValidFilename(filename: string): boolean {
  // Must not be empty
  if (!filename || filename.trim().length === 0) return false;

  // Must not contain path separators
  if (/[/\\:*?"<>|]/.test(filename)) return false;

  // Must not be just dots
  if (/^\.+$/.test(filename)) return false;

  // Must have an extension
  if (!getFileExtension(filename)) return false;

  return true;
}

/**
 * Check if file is empty
 */
export function isFileEmpty(file: File): boolean {
  return file.size === 0;
}

/**
 * Check if file is too large for browser memory
 * Warns if file might cause performance issues
 */
export function isFileTooLargeForBrowser(file: File): boolean {
  // Files larger than 100MB might cause browser performance issues
  const BROWSER_LIMIT = 100 * 1024 * 1024; // 100MB
  return file.size > BROWSER_LIMIT;
}

// ============================================================================
// Export
// ============================================================================

export const validation = {
  validateFile,
  validateFiles,
  validateSecurity,
  validateImageDimensions,
  validateVideoDuration,
  validateCategory,
  validateFileComprehensive,
  validateFilesComprehensive,
  isValidFilename,
  isFileEmpty,
  isFileTooLargeForBrowser,
  getImageDimensions,
  getVideoDuration,
} as const;
