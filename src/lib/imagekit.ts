/**
 * ImageKit Client Service
 *
 * Centralized ImageKit SDK initialization and utility functions
 * for the Hogwarts library image management.
 *
 * @see https://docs.imagekit.io/
 */

import ImageKit from "imagekit";

// ============================================================================
// Configuration
// ============================================================================

const IMAGEKIT_CONFIG = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
};

// Folder structure for Hogwarts
export const IMAGEKIT_FOLDERS = {
  LIBRARY_BOOKS: "hogwarts/library/books",
  LIBRARY_AUTHORS: "hogwarts/library/authors",
  AVATARS: "hogwarts/avatars",
  BANNERS: "hogwarts/banners",
  EXCUSE_ATTACHMENTS: "hogwarts/attendance/excuses",
} as const;

// ============================================================================
// ImageKit Instance (Server-side only)
// ============================================================================

/**
 * ImageKit server-side instance
 * IMPORTANT: Only use this in server components or API routes
 */
export const imagekit = new ImageKit(IMAGEKIT_CONFIG);

// ============================================================================
// Authentication
// ============================================================================

/**
 * Generate authentication parameters for client-side uploads
 * These are time-limited tokens for secure direct uploads
 */
export function getAuthenticationParameters() {
  return imagekit.getAuthenticationParameters();
}

// ============================================================================
// URL Generation
// ============================================================================

export interface TransformationOptions {
  /** Width in pixels */
  width?: number;
  /** Height in pixels */
  height?: number;
  /** Quality (1-100) */
  quality?: number;
  /** Crop mode */
  crop?: "maintain_ratio" | "force" | "at_least" | "at_max";
  /** Focus area for cropping */
  focus?: "center" | "top" | "left" | "bottom" | "right" | "auto";
  /** Output format */
  format?: "auto" | "webp" | "jpg" | "png" | "avif";
  /** Blur amount (1-100) */
  blur?: number;
}

/**
 * Generate an optimized ImageKit URL with transformations
 *
 * @param path - Image path (e.g., "hogwarts/library/books/abc123/cover.jpg")
 * @param options - Transformation options
 * @returns Optimized URL with transformations
 *
 * @example
 * getImagekitUrl("hogwarts/library/books/abc/cover.jpg", { width: 300, quality: 80 })
 * // Returns: https://ik.imagekit.io/abdout/hogwarts/library/books/abc/cover.jpg?tr=w-300,q-80
 */
export function getImagekitUrl(path: string, options?: TransformationOptions): string {
  const transformations: Record<string, string>[] = [];

  if (options) {
    const tr: Record<string, string> = {};

    if (options.width) tr.width = options.width.toString();
    if (options.height) tr.height = options.height.toString();
    if (options.quality) tr.quality = options.quality.toString();
    if (options.crop) tr.crop = options.crop;
    if (options.focus) tr.focus = options.focus;
    if (options.format) tr.format = options.format;
    if (options.blur) tr.blur = options.blur.toString();

    if (Object.keys(tr).length > 0) {
      transformations.push(tr);
    }
  }

  return imagekit.url({
    path: path.startsWith("/") ? path : `/${path}`,
    transformation: transformations.length > 0 ? transformations : undefined,
  });
}

/**
 * Get URL endpoint for client-side use
 */
export function getUrlEndpoint(): string {
  return process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
}

// ============================================================================
// Preset Transformations for Library Books
// ============================================================================

export const BOOK_COVER_PRESETS = {
  /** Small thumbnail for lists (200x267, 3:4 ratio) */
  thumbnail: { width: 200, height: 267, quality: 75, crop: "maintain_ratio" as const },
  /** Card display (300x400) */
  card: { width: 300, height: 400, quality: 80, crop: "maintain_ratio" as const },
  /** Detail page (600x800) */
  detail: { width: 600, height: 800, quality: 90, crop: "maintain_ratio" as const },
  /** Full quality original */
  original: { quality: 100 },
} as const;

/**
 * Get optimized book cover URL with preset transformation
 *
 * @param coverUrl - Full ImageKit URL or path
 * @param preset - Preset name (thumbnail, card, detail, original)
 * @returns Optimized URL
 */
export function getBookCoverUrl(
  coverUrl: string,
  preset: keyof typeof BOOK_COVER_PRESETS = "card"
): string {
  // If it's already an ImageKit URL, extract the path
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!;
  let path = coverUrl;

  if (coverUrl.startsWith(urlEndpoint)) {
    path = coverUrl.replace(urlEndpoint, "");
  } else if (coverUrl.startsWith("https://ik.imagekit.io/")) {
    // Extract path from any ImageKit URL
    const url = new URL(coverUrl);
    path = url.pathname.replace(/^\/[^/]+/, ""); // Remove the account name
  }

  return getImagekitUrl(path, BOOK_COVER_PRESETS[preset]);
}

// ============================================================================
// Upload Helpers
// ============================================================================

export interface UploadOptions {
  /** File to upload (base64, URL, or Buffer) */
  file: string | Buffer;
  /** File name */
  fileName: string;
  /** Folder path */
  folder?: string;
  /** Tags for organization */
  tags?: string[];
  /** Use unique filename */
  useUniqueFileName?: boolean;
  /** Custom metadata */
  customMetadata?: Record<string, string | number | boolean>;
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

/**
 * Upload a file to ImageKit (server-side only)
 *
 * @param options - Upload options
 * @returns Upload result with file details
 */
export async function uploadFile(options: UploadOptions): Promise<UploadResult> {
  const response = await imagekit.upload({
    file: options.file,
    fileName: options.fileName,
    folder: options.folder || IMAGEKIT_FOLDERS.LIBRARY_BOOKS,
    tags: options.tags,
    useUniqueFileName: options.useUniqueFileName ?? true,
    customMetadata: options.customMetadata,
  });

  return {
    fileId: response.fileId,
    name: response.name,
    url: response.url,
    thumbnailUrl: response.thumbnailUrl,
    filePath: response.filePath,
    size: response.size,
    fileType: response.fileType,
    height: response.height,
    width: response.width,
  };
}

/**
 * Delete a file from ImageKit (server-side only)
 *
 * @param fileId - ImageKit file ID
 */
export async function deleteFile(fileId: string): Promise<void> {
  await imagekit.deleteFile(fileId);
}

/**
 * Get file details from ImageKit (server-side only)
 *
 * @param fileId - ImageKit file ID
 */
export async function getFileDetails(fileId: string) {
  return imagekit.getFileDetails(fileId);
}
