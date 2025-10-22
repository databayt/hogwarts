/**
 * File Upload Server Actions
 * Replaces API routes with server actions following the file standard
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import type {
  UploadFileInput,
  DeleteFileInput,
  ListFilesInput,
  GetFileInput,
  FileMetadata,
} from './types';
import { uploadToProvider, deleteFromProvider, listFromProvider } from './lib/providers';
import { getStorageProvider } from './config/storage-config';
import { generateUniqueFilename } from './lib/formatters';
import { detectCategory } from './config/file-types';
import { z } from 'zod';

// ============================================================================
// Validation Schemas
// ============================================================================

const uploadFileSchema = z.object({
  folder: z.string(),
  category: z.enum(['image', 'video', 'document', 'audio', 'archive', 'other']),
  type: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const deleteFileSchema = z.object({
  url: z.string().url(),
  force: z.boolean().optional().default(false),
});

const listFilesSchema = z.object({
  folder: z.string().optional(),
  category: z.enum(['image', 'video', 'document', 'audio', 'archive', 'other']).optional(),
  type: z.string().optional(),
  limit: z.number().optional().default(100),
  offset: z.number().optional().default(0),
});

const getFileSchema = z.object({
  id: z.string(),
});

// ============================================================================
// Upload File Action
// ============================================================================

export async function uploadFileAction(formData: FormData) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // 2. Get tenant context
    const schoolId = session.user.schoolId;
    if (!schoolId) {
      return {
        success: false,
        error: 'School context required',
      };
    }

    // 3. Extract and validate form data
    const file = formData.get('file') as File;
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      };
    }

    const folder = formData.get('folder') as string;
    const category = formData.get('category') as string;
    const type = formData.get('type') as string | undefined;
    const metadataStr = formData.get('metadata') as string | undefined;

    const validated = uploadFileSchema.parse({
      folder,
      category,
      type,
      metadata: metadataStr ? JSON.parse(metadataStr) : undefined,
    });

    // 4. Check file size
    if (file.size === 0) {
      return {
        success: false,
        error: 'File is empty',
      };
    }

    // 5. Determine storage provider
    const providerConfig = getStorageProvider(
      validated.category as any,
      file.size,
      validated.folder
    );

    // 6. Generate file path
    const filename = generateUniqueFilename(file.name, schoolId);
    const folderPath = validated.folder || `${schoolId}/uploads`;
    const fullPath = `${folderPath}/${filename}`;

    // 7. Upload to provider
    const url = await uploadToProvider(
      file,
      fullPath,
      providerConfig.provider
    );

    // 8. Save metadata to database
    const metadata = await db.fileMetadata.create({
      data: {
        filename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        category: validated.category,
        type: validated.type,
        url,
        pathname: fullPath,
        uploadedBy: session.user.id!,
        schoolId,
        folder: folderPath,
        storageProvider: providerConfig.provider,
        storageTier: providerConfig.tier,
        metadata: validated.metadata as any,
      },
    });

    // 9. Log upload
    logger.info('File uploaded via server action', {
      action: 'file_upload',
      schoolId,
      filename,
      size: file.size,
      category: validated.category,
      provider: providerConfig.provider,
      userId: session.user.id,
    });

    // 10. Revalidate paths
    revalidatePath(`/${schoolId}/files`);

    return {
      success: true,
      metadata: {
        id: metadata.id,
        filename: metadata.filename,
        originalName: metadata.originalName,
        size: metadata.size,
        mimeType: metadata.mimeType,
        category: metadata.category,
        type: metadata.type,
        url: metadata.url,
        pathname: metadata.pathname,
        uploadedAt: metadata.uploadedAt,
        uploadedBy: metadata.uploadedBy,
        schoolId: metadata.schoolId,
        folder: metadata.folder,
        storageProvider: metadata.storageProvider,
        storageTier: metadata.storageTier,
      } as FileMetadata,
    };
  } catch (error) {
    logger.error(
      'File upload action failed',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        action: 'file_upload_error',
      }
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// ============================================================================
// Delete File Action
// ============================================================================

export async function deleteFileAction(data: DeleteFileInput) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // 2. Validate input
    const validated = deleteFileSchema.parse(data);

    // 3. Find file in database
    const file = await db.fileMetadata.findFirst({
      where: {
        url: validated.url,
        schoolId: data.schoolId,
      },
    });

    if (!file) {
      return {
        success: false,
        error: 'File not found',
      };
    }

    // 4. Check if file is referenced (unless force delete)
    if (!validated.force) {
      // TODO: Add reference checks once lesson/chapter models are updated with file URLs
      // For now, allow deletion
    }

    // 5. Delete from storage provider
    const deleted = await deleteFromProvider(
      validated.url,
      file.storageProvider as any
    );

    if (!deleted) {
      return {
        success: false,
        error: 'Failed to delete file from storage',
      };
    }

    // 6. Delete from database
    await db.fileMetadata.delete({
      where: { id: file.id },
    });

    // 7. Log deletion
    logger.info('File deleted via server action', {
      action: 'file_delete',
      schoolId: data.schoolId,
      url: validated.url,
      userId: session.user.id,
    });

    // 8. Revalidate paths
    revalidatePath(`/${data.schoolId}/files`);

    return {
      success: true,
    };
  } catch (error) {
    logger.error(
      'File delete action failed',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        action: 'file_delete_error',
      }
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

// ============================================================================
// List Files Action
// ============================================================================

export async function listFilesAction(data: ListFilesInput) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // 2. Validate input
    const validated = listFilesSchema.parse(data);

    // 3. Query database
    const files = await db.fileMetadata.findMany({
      where: {
        schoolId: data.schoolId,
        folder: validated.folder
          ? { contains: validated.folder }
          : undefined,
        category: validated.category,
        type: validated.type,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
      take: validated.limit,
      skip: validated.offset,
    });

    // 4. Get total count
    const total = await db.fileMetadata.count({
      where: {
        schoolId: data.schoolId,
        folder: validated.folder
          ? { contains: validated.folder }
          : undefined,
        category: validated.category,
        type: validated.type,
      },
    });

    return {
      success: true,
      files: files as FileMetadata[],
      total,
      limit: validated.limit,
      offset: validated.offset,
    };
  } catch (error) {
    logger.error(
      'List files action failed',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        action: 'list_files_error',
      }
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list files',
    };
  }
}

// ============================================================================
// Get File Action
// ============================================================================

export async function getFileAction(data: GetFileInput) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Unauthorized',
      };
    }

    // 2. Validate input
    const validated = getFileSchema.parse(data);

    // 3. Query database
    const file = await db.fileMetadata.findFirst({
      where: {
        id: validated.id,
        schoolId: data.schoolId,
      },
    });

    if (!file) {
      return {
        success: false,
        error: 'File not found',
      };
    }

    // 4. Update access tracking
    await db.fileMetadata.update({
      where: { id: file.id },
      data: {
        accessCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    return {
      success: true,
      file: file as FileMetadata,
    };
  } catch (error) {
    logger.error(
      'Get file action failed',
      error instanceof Error ? error : new Error('Unknown error'),
      {
        action: 'get_file_error',
      }
    );

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get file',
    };
  }
}
