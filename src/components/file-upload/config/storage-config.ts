

/**
 * Storage Configuration
 * Multi-tier storage strategy following LMS best practices
 * Inspired by Moodle, Canvas LMS, and Google Classroom
 */

import type {
  StorageProvider,
  StorageTier,
  FileCategory,
  StorageProviderConfig,
} from '../types';

// ============================================================================
// Storage Tiers (LMS Best Practice)
// ============================================================================

/**
 * Hot Storage: Frequently accessed files (<30 days, <100MB)
 * - Profile images, avatars, logos
 * - Recent course materials
 * - Active assignments
 */
export const HOT_STORAGE: StorageProviderConfig = {
  provider: 'vercel_blob',
  maxSize: 100 * 1024 * 1024, // 100MB
  tier: 'hot',
  accessPattern: 'frequent',
};

/**
 * Warm Storage: Regularly accessed files (30-90 days, <500MB)
 * - Course videos and materials
 * - Assignment submissions
 * - Library resources
 */
export const WARM_STORAGE: StorageProviderConfig = {
  provider: 'aws_s3', // S3 Standard
  maxSize: 500 * 1024 * 1024, // 500MB
  tier: 'warm',
  accessPattern: 'regular',
};

/**
 * Cold Storage: Long-term archival (>90 days, unlimited)
 * - Student records and certificates
 * - Completed course archives
 * - Financial records
 */
export const COLD_STORAGE: StorageProviderConfig = {
  provider: 'aws_s3', // S3 Glacier or R2
  maxSize: Infinity,
  tier: 'cold',
  accessPattern: 'archive',
};

// ============================================================================
// File Size Limits
// ============================================================================

export const FILE_SIZE_LIMITS = {
  // Images
  avatar: 2 * 1024 * 1024, // 2MB
  logo: 5 * 1024 * 1024, // 5MB
  banner: 10 * 1024 * 1024, // 10MB
  thumbnail: 5 * 1024 * 1024, // 5MB
  content_image: 50 * 1024 * 1024, // 50MB

  // Videos
  lesson_video: 5 * 1024 * 1024 * 1024, // 5GB (40+ min 1080p)
  course_video: 5 * 1024 * 1024 * 1024, // 5GB
  assignment_video: 500 * 1024 * 1024, // 500MB

  // Documents
  pdf: 50 * 1024 * 1024, // 50MB
  document: 50 * 1024 * 1024, // 50MB (Word, Excel, PPT)
  certificate: 10 * 1024 * 1024, // 10MB
  receipt: 5 * 1024 * 1024, // 5MB
  student_record: 10 * 1024 * 1024, // 10MB

  // Audio
  audio: 100 * 1024 * 1024, // 100MB

  // Archives
  archive: 500 * 1024 * 1024, // 500MB
} as const;

// ============================================================================
// Storage Rules by File Category
// ============================================================================

export const STORAGE_RULES: Record<FileCategory, StorageProviderConfig> = {
  image: HOT_STORAGE,
  video: WARM_STORAGE,
  document: WARM_STORAGE,
  audio: WARM_STORAGE,
  archive: COLD_STORAGE,
  other: WARM_STORAGE,
};

// ============================================================================
// Folder Organization (Multi-tenant structure)
// ============================================================================

export const STORAGE_FOLDERS = {
  // User assets
  avatars: (schoolId: string) => `${schoolId}/avatars`,
  logos: (schoolId: string) => `${schoolId}/logos`,
  banners: (schoolId: string) => `${schoolId}/banners`,

  // Course content
  courses: (schoolId: string, courseId: string) => `${schoolId}/courses/${courseId}`,
  courseMaterials: (schoolId: string, courseId: string) =>
    `${schoolId}/courses/${courseId}/materials`,
  courseVideos: (schoolId: string, courseId: string) =>
    `${schoolId}/courses/${courseId}/videos`,
  courseAssignments: (schoolId: string, courseId: string) =>
    `${schoolId}/courses/${courseId}/assignments`,

  // Student submissions
  submissions: (schoolId: string, studentId: string, assignmentId: string) =>
    `${schoolId}/submissions/${studentId}/${assignmentId}`,

  // Library
  library: (schoolId: string) => `${schoolId}/library`,
  libraryBooks: (schoolId: string) => `${schoolId}/library/books`,

  // Student records (cold storage)
  studentRecords: (schoolId: string, studentId: string) =>
    `${schoolId}/students/${studentId}/records`,
  certificates: (schoolId: string, studentId: string) =>
    `${schoolId}/students/${studentId}/certificates`,

  // Financial
  receipts: (schoolId: string) => `${schoolId}/financial/receipts`,
  invoices: (schoolId: string) => `${schoolId}/financial/invoices`,

  // Temporary uploads
  temp: (schoolId: string) => `${schoolId}/temp`,
} as const;

// ============================================================================
// Provider Selection Logic
// ============================================================================

/**
 * Determines the best storage provider based on file characteristics
 * Follows LMS best practices for cost optimization and performance
 */
export function getStorageProvider(
  category: FileCategory,
  fileSize: number,
  folder?: string
): StorageProviderConfig {
  // Check if file is a student record or certificate (always cold storage)
  if (folder?.includes('/records') || folder?.includes('/certificates')) {
    return COLD_STORAGE;
  }

  // Get base config for category
  const baseConfig = STORAGE_RULES[category];

  // For large videos, upgrade to warm storage even if hot was default
  if (category === 'video' && fileSize > HOT_STORAGE.maxSize) {
    return WARM_STORAGE;
  }

  // For very large files, use cold storage if available
  if (fileSize > WARM_STORAGE.maxSize) {
    return COLD_STORAGE;
  }

  return baseConfig;
}

/**
 * Get maximum file size for a category
 */
export function getMaxFileSize(category: FileCategory): number {
  const provider = STORAGE_RULES[category];
  return provider.maxSize;
}

/**
 * Check if extended storage (S3/R2) is configured
 */
export function hasExtendedStorage(): boolean {
  return !!(
    process.env.AWS_S3_BUCKET ||
    process.env.CLOUDFLARE_R2_ACCOUNT_ID
  );
}

/**
 * Get available storage providers based on environment
 */
export function getAvailableProviders(): StorageProvider[] {
  const providers: StorageProvider[] = ['vercel_blob'];

  if (process.env.AWS_S3_BUCKET) {
    providers.push('aws_s3');
  }

  if (process.env.CLOUDFLARE_R2_ACCOUNT_ID) {
    providers.push('cloudflare_r2');
  }

  return providers;
}

// ============================================================================
// Storage Lifecycle Policies
// ============================================================================

/**
 * Lifecycle policies for automatic tier transitions
 * Similar to AWS S3 Lifecycle or Google Cloud Storage Object Lifecycle
 */
export const LIFECYCLE_POLICIES = {
  // Move to warm storage after 30 days of no access
  hotToWarm: {
    enabled: true,
    daysInactive: 30,
    fromTier: 'hot' as StorageTier,
    toTier: 'warm' as StorageTier,
  },

  // Move to cold storage after 90 days of no access
  warmToCold: {
    enabled: true,
    daysInactive: 90,
    fromTier: 'warm' as StorageTier,
    toTier: 'cold' as StorageTier,
  },

  // Delete temp files after 7 days
  deleteTempFiles: {
    enabled: true,
    daysInactive: 7,
    folder: 'temp',
  },
} as const;

// ============================================================================
// Video Quality Recommendations
// ============================================================================

export const VIDEO_QUALITY_RECOMMENDATIONS = {
  '480p': {
    label: '480p (SD)',
    bitrate: 2.5, // Mbps
    sizePerMinute: 18.75, // MB
    size40min: 750, // MB
    recommended: 'Basic lessons, slower connections',
  },
  '720p': {
    label: '720p (HD)',
    bitrate: 5, // Mbps
    sizePerMinute: 37.5, // MB
    size40min: 1500, // MB (1.5 GB)
    recommended: 'Standard quality, most lessons',
  },
  '1080p': {
    label: '1080p (Full HD)',
    bitrate: 8, // Mbps
    sizePerMinute: 60, // MB
    size40min: 2400, // MB (2.4 GB)
    recommended: 'High quality, detailed content',
  },
  '4K': {
    label: '4K (Ultra HD)',
    bitrate: 20, // Mbps
    sizePerMinute: 150, // MB
    size40min: 6000, // MB (6 GB)
    recommended: 'Maximum quality, large displays',
  },
} as const;

// ============================================================================
// Export Configuration
// ============================================================================

export const STORAGE_CONFIG = {
  tiers: {
    hot: HOT_STORAGE,
    warm: WARM_STORAGE,
    cold: COLD_STORAGE,
  },
  limits: FILE_SIZE_LIMITS,
  rules: STORAGE_RULES,
  folders: STORAGE_FOLDERS,
  lifecycle: LIFECYCLE_POLICIES,
  videoQuality: VIDEO_QUALITY_RECOMMENDATIONS,
  getProvider: getStorageProvider,
  getMaxSize: getMaxFileSize,
  hasExtendedStorage,
  getAvailableProviders,
} as const;
