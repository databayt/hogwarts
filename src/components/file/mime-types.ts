/**
 * File Block - MIME Type Constants
 * Comprehensive MIME type mappings and utilities
 */

import type { FileCategory } from "./types";

// ============================================================================
// MIME Type to Extension Mappings
// ============================================================================

export const MIME_TO_EXTENSIONS: Record<string, string[]> = {
  // Images
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
  "image/avif": [".avif"],
  "image/bmp": [".bmp"],
  "image/tiff": [".tiff", ".tif"],

  // Videos
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
  "video/x-matroska": [".mkv"],
  "video/ogg": [".ogv"],
  "video/3gpp": [".3gp"],

  // Audio
  "audio/mpeg": [".mp3"],
  "audio/wav": [".wav"],
  "audio/ogg": [".ogg"],
  "audio/webm": [".weba"],
  "audio/aac": [".aac"],
  "audio/flac": [".flac"],
  "audio/x-m4a": [".m4a"],

  // Documents
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-powerpoint": [".ppt"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/rtf": [".rtf"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "text/markdown": [".md"],
  "application/json": [".json"],
  "application/xml": [".xml"],
  "text/html": [".html", ".htm"],

  // Archives
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "application/x-rar-compressed": [".rar"],
  "application/gzip": [".gz"],
  "application/x-7z-compressed": [".7z"],
  "application/x-tar": [".tar"],
};

// ============================================================================
// Extension to MIME Type Mappings
// ============================================================================

export const EXTENSION_TO_MIME: Record<string, string> = Object.entries(MIME_TO_EXTENSIONS).reduce(
  (acc, [mime, extensions]) => {
    for (const ext of extensions) {
      acc[ext.toLowerCase()] = mime;
    }
    return acc;
  },
  {} as Record<string, string>
);

// ============================================================================
// Category MIME Types
// ============================================================================

export const CATEGORY_MIME_TYPES: Record<FileCategory, string[]> = {
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/avif",
    "image/bmp",
    "image/tiff",
  ],
  video: [
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "video/x-msvideo",
    "video/x-matroska",
    "video/ogg",
    "video/3gpp",
  ],
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/webm",
    "audio/aac",
    "audio/flac",
    "audio/x-m4a",
  ],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/rtf",
    "text/plain",
    "text/csv",
    "text/markdown",
    "application/json",
    "application/xml",
    "text/html",
  ],
  archive: [
    "application/zip",
    "application/x-zip-compressed",
    "application/x-rar-compressed",
    "application/gzip",
    "application/x-7z-compressed",
    "application/x-tar",
  ],
  other: [],
};

// ============================================================================
// Accept Objects for React Dropzone
// ============================================================================

export const ACCEPT_IMAGES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
};

export const ACCEPT_VIDEOS = {
  "video/mp4": [".mp4"],
  "video/webm": [".webm"],
  "video/quicktime": [".mov"],
};

export const ACCEPT_DOCUMENTS = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

export const ACCEPT_SPREADSHEETS = {
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/csv": [".csv"],
};

export const ACCEPT_CSV = {
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};

export const ACCEPT_ALL = {
  ...ACCEPT_IMAGES,
  ...ACCEPT_VIDEOS,
  ...ACCEPT_DOCUMENTS,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get MIME type from filename
 */
export function getMimeFromFilename(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return EXTENSION_TO_MIME[ext] || "application/octet-stream";
}

/**
 * Get category from MIME type
 */
export function getCategoryFromMime(mimeType: string): FileCategory {
  for (const [category, mimes] of Object.entries(CATEGORY_MIME_TYPES)) {
    if (mimes.includes(mimeType)) {
      return category as FileCategory;
    }
  }
  return "other";
}

/**
 * Check if MIME type is in category
 */
export function isInCategory(mimeType: string, category: FileCategory): boolean {
  return CATEGORY_MIME_TYPES[category].includes(mimeType);
}

/**
 * Get accept object for category
 */
export function getAcceptForCategory(category: FileCategory): Record<string, string[]> {
  const mimes = CATEGORY_MIME_TYPES[category];
  return mimes.reduce(
    (acc, mime) => {
      if (MIME_TO_EXTENSIONS[mime]) {
        acc[mime] = MIME_TO_EXTENSIONS[mime];
      }
      return acc;
    },
    {} as Record<string, string[]>
  );
}

/**
 * Validate MIME type against allowed types
 */
export function validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
  return allowedTypes.includes(mimeType);
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const extensions = MIME_TO_EXTENSIONS[mimeType];
  return extensions?.[0] || "";
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Check if file is a video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

/**
 * Check if file is a document
 */
export function isDocument(mimeType: string): boolean {
  return isInCategory(mimeType, "document");
}

/**
 * Check if file is previewable in browser
 */
export function isPreviewable(mimeType: string): boolean {
  return (
    isImage(mimeType) ||
    isVideo(mimeType) ||
    mimeType === "application/pdf" ||
    mimeType.startsWith("text/")
  );
}
