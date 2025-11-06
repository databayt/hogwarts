/**
 * Image Optimization Server Actions
 * Using Sharp for high-performance image processing
 *
 * Features:
 * - Automatic format conversion (WebP, AVIF)
 * - Responsive image generation (srcset)
 * - Thumbnail creation
 * - Image resizing and cropping
 * - Quality optimization
 * - EXIF data extraction
 */

"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { put } from "@vercel/blob";
import {
  generateCDNUrl,
  generateSignedUrl,
  type ImageTransformOptions,
} from "../lib/cdn";

type ImageFormat = "webp" | "avif" | "jpeg" | "png";
type ImageFit = "cover" | "contain" | "fill" | "inside" | "outside";

// ============================================================================
// Types
// ============================================================================

export interface OptimizeImageInput {
  fileId: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageFormat;
  fit?: ImageFit;
}

export interface OptimizeImageResult {
  success: boolean;
  transformationId?: string;
  url?: string;
  cdnUrl?: string;
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
  error?: string;
}

export interface GenerateThumbnailInput {
  fileId: string;
  size: number; // Square thumbnail (e.g., 256)
}

export interface GenerateThumbnailResult {
  success: boolean;
  transformationId?: string;
  url?: string;
  cdnUrl?: string;
  error?: string;
}

export interface GenerateResponsiveInput {
  fileId: string;
  widths: number[]; // e.g., [320, 640, 1024, 1536]
  format?: ImageFormat;
}

export interface GenerateResponsiveResult {
  success: boolean;
  transformations?: Array<{
    id: string;
    width: number;
    url: string;
    cdnUrl: string;
  }>;
  srcset?: string;
  error?: string;
}

export interface ExtractImageMetadataResult {
  success: boolean;
  metadata?: {
    width: number;
    height: number;
    format: string;
    space: string;
    channels: number;
    hasAlpha: boolean;
    orientation?: number;
    exif?: Record<string, any>;
  };
  error?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get Sharp fit mode from string
 */
function getSharpFit(fit: ImageFit): keyof sharp.FitEnum {
  const fitMap: Record<ImageFit, keyof sharp.FitEnum> = {
    cover: "cover",
    contain: "contain",
    fill: "fill",
    inside: "inside",
    outside: "outside",
  };
  return fitMap[fit];
}

/**
 * Upload optimized image to storage
 */
async function uploadOptimizedImage(
  buffer: Buffer,
  originalStorageKey: string,
  transformation: string
): Promise<string> {
  // Generate new storage key with transformation suffix
  const parts = originalStorageKey.split("/");
  const filename = parts[parts.length - 1];
  const nameWithoutExt = filename.split(".")[0];
  const newFilename = `${nameWithoutExt}-${transformation}.webp`;
  const newStorageKey = [...parts.slice(0, -1), newFilename].join("/");

  // Upload to Vercel Blob (for transformed images, always use HOT tier)
  const blob = await put(newStorageKey, buffer, {
    access: "public",
    contentType: "image/webp",
  });

  return blob.url;
}

// ============================================================================
// Server Actions
// ============================================================================

/**
 * Optimize single image with custom settings
 */
export async function optimizeImage(
  input: OptimizeImageInput
): Promise<OptimizeImageResult> {
  try {
    // 1. Authentication & Tenant Isolation
    const session = await auth();
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const { schoolId } = session.user;
    const { fileId, width, height, quality = 80, format = "webp", fit = "cover" } = input;

    // 2. Get original file
    const file = await db.fileMetadata.findFirst({
      where: {
        id: fileId,
        schoolId,
        category: "IMAGE",
      },
    });

    if (!file) {
      return {
        success: false,
        error: "Image not found",
      };
    }

    if (!file.publicUrl) {
      return {
        success: false,
        error: "Image URL not available",
      };
    }

    // 3. Fetch original image
    const response = await fetch(file.publicUrl);
    if (!response.ok) {
      return {
        success: false,
        error: "Failed to fetch original image",
      };
    }

    const originalBuffer = Buffer.from(await response.arrayBuffer());

    // 4. Process image with Sharp
    let sharpInstance = sharp(originalBuffer);

    // Apply transformations
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: sharp.fit[getSharpFit(fit)],
        withoutEnlargement: true,
      });
    }

    // Convert format and optimize
    if (format === "webp") {
      sharpInstance = sharpInstance.webp({ quality });
    } else if (format === "avif") {
      sharpInstance = sharpInstance.avif({ quality });
    } else if (format === "jpeg") {
      sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
    } else if (format === "png") {
      sharpInstance = sharpInstance.png({ compressionLevel: 9 });
    }

    const processedBuffer = await sharpInstance.toBuffer();
    const metadata = await sharp(processedBuffer).metadata();

    // 5. Upload optimized image
    const transformation = `${width || "auto"}x${height || "auto"}-${format}-q${quality}`;
    const optimizedUrl = await uploadOptimizedImage(
      processedBuffer,
      file.storageKey,
      transformation
    );

    // 6. Generate CDN URL
    const cdnUrl = generateCDNUrl(optimizedUrl);
    const signedCdnUrl = generateSignedUrl(cdnUrl);

    // 7. Save transformation record
    const transformationRecord = await db.fileTransformation.create({
      data: {
        fileId: file.id,
        type: "optimize",
        width: width || null,
        height: height || null,
        format: format,
        quality: quality || null,
        size: BigInt(processedBuffer.length),
        storageKey: optimizedUrl,
        url: signedCdnUrl,
      },
    });

    // 8. Revalidate
    revalidatePath("/files");

    return {
      success: true,
      transformationId: transformationRecord.id,
      url: optimizedUrl,
      cdnUrl: signedCdnUrl,
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || format,
        size: processedBuffer.length,
      },
    };
  } catch (error) {
    console.error("[optimizeImage] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to optimize image",
    };
  }
}

/**
 * Generate square thumbnail
 */
export async function generateThumbnail(
  input: GenerateThumbnailInput
): Promise<GenerateThumbnailResult> {
  try {
    // 1. Authentication & Tenant Isolation
    const session = await auth();
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const { schoolId } = session.user;
    const { fileId, size } = input;

    // 2. Get original file
    const file = await db.fileMetadata.findFirst({
      where: {
        id: fileId,
        schoolId,
        category: "IMAGE",
      },
    });

    if (!file) {
      return {
        success: false,
        error: "Image not found",
      };
    }

    if (!file.publicUrl) {
      return {
        success: false,
        error: "Image URL not available",
      };
    }

    // 3. Fetch and process image
    const response = await fetch(file.publicUrl);
    if (!response.ok) {
      return {
        success: false,
        error: "Failed to fetch original image",
      };
    }

    const originalBuffer = Buffer.from(await response.arrayBuffer());

    // Create square thumbnail with cover fit
    const thumbnailBuffer = await sharp(originalBuffer)
      .resize(size, size, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: 80 })
      .toBuffer();

    // 4. Upload thumbnail
    const transformation = `thumb-${size}`;
    const thumbnailUrl = await uploadOptimizedImage(
      thumbnailBuffer,
      file.storageKey,
      transformation
    );

    // 5. Generate CDN URL
    const cdnUrl = generateCDNUrl(thumbnailUrl);
    const signedCdnUrl = generateSignedUrl(cdnUrl);

    // 6. Save transformation record
    const transformationRecord = await db.fileTransformation.create({
      data: {
        fileId: file.id,
        type: "thumbnail",
        width: size,
        height: size,
        format: "webp",
        quality: 80,
        size: BigInt(0), // Size will be updated later
        storageKey: thumbnailUrl,
        url: signedCdnUrl,
      },
    });

    // 7. Revalidate
    revalidatePath("/files");

    return {
      success: true,
      transformationId: transformationRecord.id,
      url: thumbnailUrl,
      cdnUrl: signedCdnUrl,
    };
  } catch (error) {
    console.error("[generateThumbnail] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate thumbnail",
    };
  }
}

/**
 * Generate responsive image set (srcset)
 */
export async function generateResponsiveImages(
  input: GenerateResponsiveInput
): Promise<GenerateResponsiveResult> {
  try {
    // 1. Authentication & Tenant Isolation
    const session = await auth();
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const { schoolId } = session.user;
    const { fileId, widths, format = "webp" } = input;

    // 2. Get original file
    const file = await db.fileMetadata.findFirst({
      where: {
        id: fileId,
        schoolId,
        category: "IMAGE",
      },
    });

    if (!file) {
      return {
        success: false,
        error: "Image not found",
      };
    }

    if (!file.publicUrl) {
      return {
        success: false,
        error: "Image URL not available",
      };
    }

    // 3. Fetch original image
    const response = await fetch(file.publicUrl);
    if (!response.ok) {
      return {
        success: false,
        error: "Failed to fetch original image",
      };
    }

    const originalBuffer = Buffer.from(await response.arrayBuffer());

    // 4. Generate images for each width
    const transformations = await Promise.all(
      widths.map(async (width) => {
        // Process image
        const resizedBuffer = await sharp(originalBuffer)
          .resize(width, undefined, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();

        // Upload
        const transformation = `w${width}-${format}`;
        const url = await uploadOptimizedImage(
          resizedBuffer,
          file.storageKey,
          transformation
        );

        // Generate CDN URL
        const cdnUrl = generateCDNUrl(url);
        const signedCdnUrl = generateSignedUrl(cdnUrl);

        // Save transformation record
        const record = await db.fileTransformation.create({
          data: {
            fileId: file.id,
            type: "resize",
            width: width,
            height: null,
            format,
            quality: 85,
            size: BigInt(resizedBuffer.length),
            storageKey: url,
            url: signedCdnUrl,
          },
        });

        return {
          id: record.id,
          width,
          url,
          cdnUrl: signedCdnUrl,
        };
      })
    );

    // 5. Generate srcset string
    const srcset = transformations
      .map((t) => `${t.cdnUrl} ${t.width}w`)
      .join(", ");

    // 6. Revalidate
    revalidatePath("/files");

    return {
      success: true,
      transformations,
      srcset,
    };
  } catch (error) {
    console.error("[generateResponsiveImages] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate responsive images",
    };
  }
}

/**
 * Extract image metadata and EXIF data
 */
export async function extractImageMetadata(
  fileId: string
): Promise<ExtractImageMetadataResult> {
  try {
    // 1. Authentication & Tenant Isolation
    const session = await auth();
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const { schoolId } = session.user;

    // 2. Get file
    const file = await db.fileMetadata.findFirst({
      where: {
        id: fileId,
        schoolId,
        category: "IMAGE",
      },
    });

    if (!file) {
      return {
        success: false,
        error: "Image not found",
      };
    }

    if (!file.publicUrl) {
      return {
        success: false,
        error: "Image URL not available",
      };
    }

    // 3. Fetch and analyze image
    const response = await fetch(file.publicUrl);
    if (!response.ok) {
      return {
        success: false,
        error: "Failed to fetch image",
      };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const metadata = await sharp(buffer).metadata();

    // 4. Update file metadata in database
    await db.fileMetadata.update({
      where: { id: fileId },
      data: {
        width: metadata.width,
        height: metadata.height,
        metadata: {
          format: metadata.format,
          space: metadata.space,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha,
          orientation: metadata.orientation,
          exif: metadata.exif,
        } as any,
      },
    });

    return {
      success: true,
      metadata: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || "unknown",
        space: metadata.space || "unknown",
        channels: metadata.channels || 0,
        hasAlpha: metadata.hasAlpha || false,
        orientation: metadata.orientation,
        exif: metadata.exif as Record<string, any>,
      },
    };
  } catch (error) {
    console.error("[extractImageMetadata] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to extract metadata",
    };
  }
}

/**
 * Automatically optimize image on upload
 * Creates WebP version + thumbnail
 */
export async function autoOptimizeImage(
  fileId: string
): Promise<{
  success: boolean;
  webpUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}> {
  try {
    // Generate WebP version
    const webpResult = await optimizeImage({
      fileId,
      format: "webp",
      quality: 85,
    });

    if (!webpResult.success) {
      return {
        success: false,
        error: webpResult.error,
      };
    }

    // Generate thumbnail
    const thumbnailResult = await generateThumbnail({
      fileId,
      size: 256,
    });

    if (!thumbnailResult.success) {
      return {
        success: false,
        error: thumbnailResult.error,
      };
    }

    // Extract metadata
    await extractImageMetadata(fileId);

    return {
      success: true,
      webpUrl: webpResult.cdnUrl,
      thumbnailUrl: thumbnailResult.cdnUrl,
    };
  } catch (error) {
    console.error("[autoOptimizeImage] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Auto-optimization failed",
    };
  }
}
