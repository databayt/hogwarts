/**
 * File Types Configuration
 * Defines accepted file types, MIME types, and extensions
 */

import type { FileCategory, FileTypeConfig } from '../types';
import { FILE_SIZE_LIMITS } from './storage-config';

// ============================================================================
// MIME Type Definitions
// ============================================================================

export const MIME_TYPES = {
  // Images
  image: {
    jpeg: 'image/jpeg',
    jpg: 'image/jpg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
  },

  // Videos
  video: {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    flv: 'video/x-flv',
    wmv: 'video/x-ms-wmv',
  },

  // Documents
  document: {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    rtf: 'application/rtf',
    odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet',
    odp: 'application/vnd.oasis.opendocument.presentation',
  },

  // Audio
  audio: {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    flac: 'audio/flac',
    aac: 'audio/aac',
  },

  // Archives
  archive: {
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  },
} as const;

// ============================================================================
// Accept Patterns for React Dropzone
// ============================================================================

export const ACCEPT_PATTERNS = {
  image: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/svg+xml': ['.svg'],
    'image/webp': ['.webp'],
  },

  video: {
    'video/mp4': ['.mp4'],
    'video/webm': ['.webm'],
    'video/quicktime': ['.mov'],
    'video/x-msvideo': ['.avi'],
    'video/x-matroska': ['.mkv'],
  },

  document: {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
      '.docx',
    ],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
      '.xlsx',
    ],
    'application/vnd.ms-powerpoint': ['.ppt'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
      '.pptx',
    ],
    'text/plain': ['.txt'],
  },

  audio: {
    'audio/mpeg': ['.mp3'],
    'audio/wav': ['.wav'],
    'audio/ogg': ['.ogg'],
    'audio/mp4': ['.m4a'],
    'audio/flac': ['.flac'],
  },

  archive: {
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
    'application/x-7z-compressed': ['.7z'],
    'application/x-tar': ['.tar'],
    'application/gzip': ['.gz'],
  },

  // Specific type combinations
  avatar: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
  },

  logo: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/svg+xml': ['.svg'],
    'image/webp': ['.webp'],
  },

  certificate: {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  },

  receipt: {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  },
} as const;

// ============================================================================
// File Type Configurations
// ============================================================================

export const FILE_TYPE_CONFIGS: Record<string, FileTypeConfig> = {
  // Images
  avatar: {
    category: 'image',
    type: 'avatar',
    accept: ACCEPT_PATTERNS.avatar as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.avatar,
    allowedMimeTypes: [
      MIME_TYPES.image.jpeg,
      MIME_TYPES.image.png,
      MIME_TYPES.image.webp,
    ] as readonly string[],
    storageTier: 'hot',
  },

  logo: {
    category: 'image',
    type: 'logo',
    accept: ACCEPT_PATTERNS.logo as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.logo,
    allowedMimeTypes: [
      MIME_TYPES.image.jpeg,
      MIME_TYPES.image.png,
      MIME_TYPES.image.svg,
      MIME_TYPES.image.webp,
    ] as readonly string[],
    storageTier: 'hot',
  },

  banner: {
    category: 'image',
    type: 'banner',
    accept: ACCEPT_PATTERNS.image as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.banner,
    allowedMimeTypes: Object.values(MIME_TYPES.image) as readonly string[],
    storageTier: 'hot',
  },

  thumbnail: {
    category: 'image',
    type: 'thumbnail',
    accept: ACCEPT_PATTERNS.image as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.thumbnail,
    allowedMimeTypes: Object.values(MIME_TYPES.image) as readonly string[],
    storageTier: 'hot',
  },

  content_image: {
    category: 'image',
    type: 'content',
    accept: ACCEPT_PATTERNS.image as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.content_image,
    allowedMimeTypes: Object.values(MIME_TYPES.image) as readonly string[],
    storageTier: 'hot',
  },

  // Videos
  lesson_video: {
    category: 'video',
    type: 'lesson',
    accept: ACCEPT_PATTERNS.video as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.lesson_video,
    allowedMimeTypes: Object.values(MIME_TYPES.video) as readonly string[],
    storageTier: 'warm',
  },

  course_video: {
    category: 'video',
    type: 'course',
    accept: ACCEPT_PATTERNS.video as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.course_video,
    allowedMimeTypes: Object.values(MIME_TYPES.video) as readonly string[],
    storageTier: 'warm',
  },

  assignment_video: {
    category: 'video',
    type: 'assignment',
    accept: ACCEPT_PATTERNS.video as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.assignment_video,
    allowedMimeTypes: Object.values(MIME_TYPES.video) as readonly string[],
    storageTier: 'warm',
  },

  // Documents
  pdf: {
    category: 'document',
    type: 'pdf',
    accept: { 'application/pdf': ['.pdf'] } as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.pdf,
    allowedMimeTypes: [MIME_TYPES.document.pdf] as readonly string[],
    storageTier: 'warm',
  },

  certificate: {
    category: 'document',
    type: 'certificate',
    accept: ACCEPT_PATTERNS.certificate as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.certificate,
    allowedMimeTypes: [
      MIME_TYPES.document.pdf,
      MIME_TYPES.image.jpeg,
      MIME_TYPES.image.png,
    ] as readonly string[],
    storageTier: 'cold',
  },

  receipt: {
    category: 'document',
    type: 'receipt',
    accept: ACCEPT_PATTERNS.receipt as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.receipt,
    allowedMimeTypes: [
      MIME_TYPES.document.pdf,
      MIME_TYPES.image.jpeg,
      MIME_TYPES.image.png,
    ] as readonly string[],
    storageTier: 'warm',
  },

  student_record: {
    category: 'document',
    type: 'student_record',
    accept: ACCEPT_PATTERNS.document as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.student_record,
    allowedMimeTypes: Object.values(MIME_TYPES.document) as readonly string[],
    storageTier: 'cold',
  },

  document: {
    category: 'document',
    type: 'word',
    accept: ACCEPT_PATTERNS.document as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.document,
    allowedMimeTypes: Object.values(MIME_TYPES.document) as readonly string[],
    storageTier: 'warm',
  },

  // Audio
  audio: {
    category: 'audio',
    type: 'word', // Default, will be overridden
    accept: ACCEPT_PATTERNS.audio as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.audio,
    allowedMimeTypes: Object.values(MIME_TYPES.audio) as readonly string[],
    storageTier: 'warm',
  },

  // Archives
  archive: {
    category: 'archive',
    type: 'word', // Default, will be overridden
    accept: ACCEPT_PATTERNS.archive as Record<string, readonly string[]>,
    maxSize: FILE_SIZE_LIMITS.archive,
    allowedMimeTypes: Object.values(MIME_TYPES.archive) as readonly string[],
    storageTier: 'cold',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get file type configuration by name
 */
export function getFileTypeConfig(
  type: string
): FileTypeConfig | undefined {
  return FILE_TYPE_CONFIGS[type];
}

/**
 * Get accept pattern for a category
 */
export function getAcceptPattern(
  category: FileCategory
): Record<string, readonly string[]> {
  return (ACCEPT_PATTERNS as any)[category] || {};
}

/**
 * Get MIME types for a category
 */
export function getMimeTypes(category: FileCategory): readonly string[] {
  return Object.values((MIME_TYPES as any)[category] || {});
}

/**
 * Detect file category from MIME type
 */
export function detectCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';

  // Check specific document types
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('opendocument') ||
    mimeType === 'text/plain'
  ) {
    return 'document';
  }

  // Check archive types
  if (
    mimeType === 'application/zip' ||
    mimeType.includes('rar') ||
    mimeType.includes('7z') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip')
  ) {
    return 'archive';
  }

  return 'other';
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : '';
}

/**
 * Check if MIME type is allowed for category
 */
export function isMimeTypeAllowed(
  mimeType: string,
  category: FileCategory
): boolean {
  const allowedTypes = getMimeTypes(category);
  return allowedTypes.includes(mimeType);
}

// ============================================================================
// Export
// ============================================================================

export const FILE_TYPES_CONFIG = {
  mime: MIME_TYPES,
  accept: ACCEPT_PATTERNS,
  configs: FILE_TYPE_CONFIGS,
  getConfig: getFileTypeConfig,
  getAcceptPattern,
  getMimeTypes,
  detectCategory,
  getFileExtension,
  isMimeTypeAllowed,
} as const;
