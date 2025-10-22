/**
 * File Upload Server Actions
 * Replaces API routes with server actions following the file standard
 */

'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
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

    // 8. Create metadata object (no database - FileMetadata model not yet implemented)
    const uploadedAt = new Date();
    const metadata: FileMetadata = {
      id: `temp-${Date.now()}`, // Temporary ID until database model is added
      filename,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      category: validated.category as any,
      type: validated.type,
      url,
      pathname: fullPath,
      uploadedAt,
      uploadedBy: session.user.id!,
      schoolId,
      folder: folderPath,
      storageProvider: providerConfig.provider as any,
      storageTier: providerConfig.tier as any,
      metadata: validated.metadata,
    };

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
      metadata,
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

    // 3. Delete from storage provider directly (no database lookup until FileMetadata model is added)
    // Note: We assume the URL is from Vercel Blob for now
    const deleted = await deleteFromProvider(
      validated.url,
      'vercel-blob' // Default provider until database tracking is implemented
    );

    if (!deleted) {
      return {
        success: false,
        error: 'Failed to delete file from storage',
      };
    }

    // 4. Log deletion
    logger.info('File deleted via server action', {
      action: 'file_delete',
      schoolId: data.schoolId,
      url: validated.url,
      userId: session.user.id,
    });

    // 5. Revalidate paths
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

    // 3. Return empty list until FileMetadata model is implemented
    // TODO: Implement database queries when FileMetadata model is added
    logger.info('List files action called (not yet implemented)', {
      action: 'list_files',
      schoolId: data.schoolId,
      folder: validated.folder,
    });

    return {
      success: true,
      files: [] as FileMetadata[],
      total: 0,
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

    // 3. Return not found until FileMetadata model is implemented
    // TODO: Implement database queries when FileMetadata model is added
    logger.info('Get file action called (not yet implemented)', {
      action: 'get_file',
      schoolId: data.schoolId,
      fileId: validated.id,
    });

    return {
      success: false,
      error: 'File tracking not yet implemented. Use direct URL access.',
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
