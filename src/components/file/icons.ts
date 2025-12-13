/**
 * File Block - Icon Mappings
 * Maps file types to Lucide icon names
 */

import type { FileCategory, FileType } from "./types";

// ============================================================================
// Category Icons
// ============================================================================

export const CATEGORY_ICONS: Record<FileCategory, string> = {
  image: "Image",
  video: "Video",
  document: "FileText",
  audio: "Music",
  archive: "Archive",
  other: "File",
};

// ============================================================================
// File Type Icons
// ============================================================================

export const FILE_TYPE_ICONS: Record<string, string> = {
  // Images
  avatar: "User",
  logo: "Palette",
  banner: "Image",
  thumbnail: "ImageIcon",
  content: "Image",

  // Videos
  lesson: "PlayCircle",
  course: "GraduationCap",
  assignment: "ClipboardList",
  promotional: "Video",

  // Documents
  pdf: "FileType",
  word: "FileText",
  excel: "FileSpreadsheet",
  powerpoint: "Presentation",
  text: "FileText",
  certificate: "Award",
  receipt: "Receipt",
  invoice: "FileText",
  report: "FileBarChart",
  transcript: "ScrollText",
  id_card: "IdCard",
};

// ============================================================================
// Extension Icons
// ============================================================================

export const EXTENSION_ICONS: Record<string, string> = {
  // Images
  ".jpg": "Image",
  ".jpeg": "Image",
  ".png": "Image",
  ".gif": "Image",
  ".webp": "Image",
  ".svg": "Image",

  // Videos
  ".mp4": "Video",
  ".webm": "Video",
  ".mov": "Video",
  ".avi": "Video",

  // Audio
  ".mp3": "Music",
  ".wav": "Music",
  ".ogg": "Music",
  ".aac": "Music",

  // Documents
  ".pdf": "FileType",
  ".doc": "FileText",
  ".docx": "FileText",
  ".xls": "FileSpreadsheet",
  ".xlsx": "FileSpreadsheet",
  ".ppt": "Presentation",
  ".pptx": "Presentation",
  ".txt": "FileText",
  ".csv": "Table",
  ".json": "FileJson",
  ".md": "FileText",

  // Archives
  ".zip": "Archive",
  ".rar": "Archive",
  ".7z": "Archive",
  ".gz": "Archive",
  ".tar": "Archive",
};

// ============================================================================
// Status Icons
// ============================================================================

export const STATUS_ICONS = {
  pending: "Clock",
  uploading: "Upload",
  success: "CheckCircle",
  error: "XCircle",
  downloading: "Download",
  processing: "Loader",
} as const;

// ============================================================================
// Action Icons
// ============================================================================

export const ACTION_ICONS = {
  upload: "Upload",
  download: "Download",
  delete: "Trash2",
  preview: "Eye",
  edit: "Edit",
  copy: "Copy",
  move: "FolderInput",
  share: "Share2",
  print: "Printer",
  export: "FileDown",
  import: "FileUp",
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get icon name for file category
 */
export function getIconForCategory(category: FileCategory): string {
  return CATEGORY_ICONS[category] || "File";
}

/**
 * Get icon name for file type
 */
export function getIconForType(type?: FileType): string {
  if (!type) return "File";
  return FILE_TYPE_ICONS[type] || "File";
}

/**
 * Get icon name for file extension
 */
export function getIconForExtension(filename: string): string {
  const ext = filename.substring(filename.lastIndexOf(".")).toLowerCase();
  return EXTENSION_ICONS[ext] || "File";
}

/**
 * Get icon name for file (auto-detect)
 */
export function getFileIcon(
  filename: string,
  options?: { category?: FileCategory; type?: FileType }
): string {
  // Try type first
  if (options?.type && FILE_TYPE_ICONS[options.type]) {
    return FILE_TYPE_ICONS[options.type];
  }

  // Try extension
  const extIcon = getIconForExtension(filename);
  if (extIcon !== "File") {
    return extIcon;
  }

  // Fall back to category
  if (options?.category) {
    return CATEGORY_ICONS[options.category];
  }

  return "File";
}
