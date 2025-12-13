/**
 * Unified File Block - Upload Server Actions
 * Multi-tenant file upload with automatic provider selection
 */

"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import type { FileCategory, FileType, StorageProvider, StorageTier } from "../types";
import { FOLDER_STRUCTURE } from "../config";
import { selectProvider, getProvider } from "../providers/factory";
import { generateUniqueFilename } from "../formatters";
import { getCategoryFromMime } from "../mime-types";

// ============================================================================
// Types
// ============================================================================

interface UploadOptions {
  category?: FileCategory;
  type?: FileType;
  folder?: string;
  provider?: StorageProvider;
  tier?: StorageTier;
  access?: "public" | "private";
  metadata?: Record<string, string>;
}

interface UploadResult {
  success: true;
  id: string;
  url: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  category: FileCategory;
  type?: string;
  provider: StorageProvider;
  tier: StorageTier;
  pathname?: string;
}

interface UploadError {
  success: false;
  error: string;
  filename?: string;
}

type UploadResponse = UploadResult | UploadError;

// ============================================================================
// Main Upload Action
// ============================================================================

/**
 * Upload a single file
 */
export async function uploadFile(
  formData: FormData,
  options: UploadOptions = {}
): Promise<UploadResponse> {
  try {
    // 1. Authenticate and get schoolId
    const session = await auth();
    const schoolId = session?.user?.schoolId;
    const userId = session?.user?.id;

    if (!schoolId || !userId) {
      return { success: false, error: "Unauthorized - no school context" };
    }

    // 2. Extract file from FormData
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }

    // 3. Determine category from MIME type if not provided
    const category = options.category || getCategoryFromMime(file.type);
    const tier = options.tier || "hot";

    // 4. Select optimal provider
    const provider = options.provider || selectProvider({
      category,
      size: file.size,
      tier,
    });

    // 5. Generate unique filename and path
    const uniqueFilename = generateUniqueFilename(file.name);
    const folder = options.folder || getFolderForCategory(category, options.type);
    const pathname = `${schoolId}/${folder}/${uniqueFilename}`;

    // 6. Get provider instance and upload
    const storageProvider = getProvider(provider);
    const url = await storageProvider.upload(file, pathname, {
      contentType: file.type,
      access: options.access || "public",
      metadata: {
        schoolId,
        userId,
        originalName: file.name,
        category,
        type: options.type || "",
        ...options.metadata,
      },
    });

    // 7. Get image dimensions if applicable
    let width: number | undefined;
    let height: number | undefined;
    if (category === "image") {
      const dimensions = await getImageDimensions(file);
      width = dimensions?.width;
      height = dimensions?.height;
    }

    // 8. Save metadata to database
    const fileRecord = await db.fileRecord.create({
      data: {
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        category,
        type: options.type,
        url,
        pathname,
        width,
        height,
        folder,
        storageProvider: provider,
        storageTier: tier,
        uploadedBy: userId,
        schoolId,
        metadata: options.metadata ? options.metadata : undefined,
      },
    });

    // 9. Revalidate cache if needed
    if (options.folder) {
      revalidatePath(`/files/${options.folder}`);
    }

    return {
      success: true,
      id: fileRecord.id,
      url,
      filename: uniqueFilename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      category,
      type: options.type,
      provider,
      tier,
      pathname,
    };
  } catch (error) {
    console.error("[uploadFile] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  formData: FormData,
  options: UploadOptions = {}
): Promise<{ results: UploadResponse[]; succeeded: number; failed: number }> {
  const files = formData.getAll("files") as File[];
  const results: UploadResponse[] = [];
  let succeeded = 0;
  let failed = 0;

  for (const file of files) {
    const singleFormData = new FormData();
    singleFormData.set("file", file);

    const result = await uploadFile(singleFormData, options);
    results.push(result);

    if (result.success) {
      succeeded++;
    } else {
      failed++;
    }
  }

  return { results, succeeded, failed };
}

// ============================================================================
// Delete Action
// ============================================================================

/**
 * Delete a file by ID
 */
export async function deleteFile(fileId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authenticate and get schoolId
    const session = await auth();
    const schoolId = session?.user?.schoolId;

    if (!schoolId) {
      return { success: false, error: "Unauthorized - no school context" };
    }

    // 2. Find file record (with schoolId check for multi-tenant safety)
    const fileRecord = await db.fileRecord.findFirst({
      where: { id: fileId, schoolId },
    });

    if (!fileRecord) {
      return { success: false, error: "File not found" };
    }

    // 3. Delete from storage provider
    const provider = getProvider(fileRecord.storageProvider as StorageProvider);
    await provider.delete(fileRecord.url);

    // 4. Delete database record
    await db.fileRecord.delete({
      where: { id: fileId },
    });

    // 5. Revalidate cache
    revalidatePath(`/files/${fileRecord.folder}`);

    return { success: true };
  } catch (error) {
    console.error("[deleteFile] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Delete multiple files
 */
export async function deleteFiles(
  fileIds: string[]
): Promise<{ succeeded: number; failed: number; errors: Array<{ id: string; error: string }> }> {
  let succeeded = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  for (const id of fileIds) {
    const result = await deleteFile(id);
    if (result.success) {
      succeeded++;
    } else {
      failed++;
      errors.push({ id, error: result.error || "Unknown error" });
    }
  }

  return { succeeded, failed, errors };
}

// ============================================================================
// Query Actions
// ============================================================================

/**
 * Get files for current school
 */
export async function getFiles(options: {
  folder?: string;
  category?: FileCategory;
  type?: string;
  limit?: number;
  offset?: number;
  orderBy?: "uploadedAt" | "size" | "name";
  order?: "asc" | "desc";
} = {}): Promise<{
  files: Array<{
    id: string;
    filename: string;
    originalName: string;
    size: number;
    mimeType: string;
    category: string;
    type: string | null;
    url: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  total: number;
}> {
  const session = await auth();
  const schoolId = session?.user?.schoolId;

  if (!schoolId) {
    return { files: [], total: 0 };
  }

  const where = {
    schoolId,
    ...(options.folder && { folder: options.folder }),
    ...(options.category && { category: options.category }),
    ...(options.type && { type: options.type }),
  };

  const [files, total] = await Promise.all([
    db.fileRecord.findMany({
      where,
      select: {
        id: true,
        filename: true,
        originalName: true,
        size: true,
        mimeType: true,
        category: true,
        type: true,
        url: true,
        uploadedAt: true,
        uploadedBy: true,
      },
      take: options.limit || 50,
      skip: options.offset || 0,
      orderBy: {
        [options.orderBy || "uploadedAt"]: options.order || "desc",
      },
    }),
    db.fileRecord.count({ where }),
  ]);

  return { files, total };
}

/**
 * Get a single file by ID
 */
export async function getFile(fileId: string) {
  const session = await auth();
  const schoolId = session?.user?.schoolId;

  if (!schoolId) {
    return null;
  }

  return db.fileRecord.findFirst({
    where: { id: fileId, schoolId },
  });
}

/**
 * Update file access count (for analytics)
 */
export async function trackFileAccess(fileId: string): Promise<void> {
  const session = await auth();
  const schoolId = session?.user?.schoolId;

  if (!schoolId) return;

  await db.fileRecord.updateMany({
    where: { id: fileId, schoolId },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    },
  });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get folder path based on category and type
 */
function getFolderForCategory(category: FileCategory, type?: FileType): string {
  if (type) {
    switch (type) {
      case "avatar":
        return FOLDER_STRUCTURE.avatars;
      case "logo":
        return FOLDER_STRUCTURE.logos;
      case "banner":
        return FOLDER_STRUCTURE.banners;
      case "invoice":
        return FOLDER_STRUCTURE.invoices;
      case "receipt":
        return FOLDER_STRUCTURE.receipts;
      case "certificate":
        return FOLDER_STRUCTURE.certificates;
      case "transcript":
        return FOLDER_STRUCTURE.transcripts;
      case "report":
        return FOLDER_STRUCTURE.reports;
      case "lesson":
      case "course":
        return FOLDER_STRUCTURE.courses;
      case "assignment":
        return FOLDER_STRUCTURE.assignments;
      default:
        break;
    }
  }

  switch (category) {
    case "image":
      return FOLDER_STRUCTURE.images;
    case "video":
      return FOLDER_STRUCTURE.videos;
    case "document":
      return FOLDER_STRUCTURE.documents;
    case "audio":
      return FOLDER_STRUCTURE.media;
    case "archive":
      return FOLDER_STRUCTURE.documents;
    default:
      return FOLDER_STRUCTURE.documents;
  }
}

/**
 * Get image dimensions from file
 */
async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  // Server-side dimension detection requires additional processing
  // For now, return null - dimensions can be set client-side before upload
  return null;
}
