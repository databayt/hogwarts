/**
 * Storage Quota Management
 * Tracks and enforces per-school storage limits
 */

import { db } from "@/lib/db";

export interface QuotaStatus {
  schoolId: string;
  // Storage
  totalStorageLimit: bigint;
  usedStorage: bigint;
  availableStorage: bigint;
  storageUsagePercent: number;
  // Daily upload
  dailyUploadLimit: bigint;
  dailyUploadUsed: bigint;
  dailyUploadAvailable: bigint;
  dailyUploadUsagePercent: number;
  dailyResetAt: Date;
  // File limits
  maxFileSize: bigint;
  maxFiles: number;
  currentFiles: number;
  availableFiles: number;
  // Rate limits
  uploadsPerHour: number;
  uploadsPerDay: number;
  // Warning status
  isNearLimit: boolean; // >80% usage
  isAtLimit: boolean; // >=100% usage
  warningThreshold: number;
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: bigint;
  limit?: bigint;
  availableSpace?: bigint;
}

/**
 * Default quota for new schools (10GB)
 */
export const DEFAULT_QUOTA = {
  totalStorageLimit: BigInt(10 * 1024 * 1024 * 1024), // 10GB
  maxFileSize: BigInt(5 * 1024 * 1024 * 1024), // 5GB per file
  dailyUploadLimit: BigInt(1 * 1024 * 1024 * 1024), // 1GB per day
  uploadsPerHour: 100,
  uploadsPerDay: 1000,
  maxFiles: 10000,
  warningThreshold: 0.8, // 80%
} as const;

/**
 * Get or create quota for a school
 */
export async function getSchoolQuota(schoolId: string) {
  let quota = await db.uploadQuota.findUnique({
    where: { schoolId },
  });

  if (!quota) {
    // Create default quota
    quota = await db.uploadQuota.create({
      data: {
        schoolId,
        totalStorageLimit: DEFAULT_QUOTA.totalStorageLimit,
        usedStorage: BigInt(0),
        maxFileSize: DEFAULT_QUOTA.maxFileSize,
        dailyUploadLimit: DEFAULT_QUOTA.dailyUploadLimit,
        dailyUploadUsed: BigInt(0),
        dailyResetAt: new Date(),
        uploadsPerHour: DEFAULT_QUOTA.uploadsPerHour,
        uploadsPerDay: DEFAULT_QUOTA.uploadsPerDay,
        maxFiles: DEFAULT_QUOTA.maxFiles,
        currentFiles: 0,
        warningThreshold: DEFAULT_QUOTA.warningThreshold,
      },
    });
  }

  return quota;
}

/**
 * Get quota status with calculated fields
 */
export async function getQuotaStatus(schoolId: string): Promise<QuotaStatus> {
  const quota = await getSchoolQuota(schoolId);

  // Reset daily quota if needed
  const now = new Date();
  if (now > quota.dailyResetAt) {
    await resetDailyQuota(schoolId);
    quota.dailyUploadUsed = BigInt(0);
    quota.dailyResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  const availableStorage = quota.totalStorageLimit - quota.usedStorage;
  const storageUsagePercent =
    Number((quota.usedStorage * BigInt(100)) / quota.totalStorageLimit) / 100;

  const dailyUploadAvailable = quota.dailyUploadLimit - quota.dailyUploadUsed;
  const dailyUploadUsagePercent =
    Number((quota.dailyUploadUsed * BigInt(100)) / quota.dailyUploadLimit) /
    100;

  const availableFiles = quota.maxFiles - quota.currentFiles;

  return {
    schoolId: quota.schoolId,
    totalStorageLimit: quota.totalStorageLimit,
    usedStorage: quota.usedStorage,
    availableStorage,
    storageUsagePercent,
    dailyUploadLimit: quota.dailyUploadLimit,
    dailyUploadUsed: quota.dailyUploadUsed,
    dailyUploadAvailable,
    dailyUploadUsagePercent,
    dailyResetAt: quota.dailyResetAt,
    maxFileSize: quota.maxFileSize,
    maxFiles: quota.maxFiles,
    currentFiles: quota.currentFiles,
    availableFiles,
    uploadsPerHour: quota.uploadsPerHour,
    uploadsPerDay: quota.uploadsPerDay,
    isNearLimit: storageUsagePercent >= quota.warningThreshold,
    isAtLimit: storageUsagePercent >= 1,
    warningThreshold: quota.warningThreshold,
  };
}

/**
 * Check if upload is allowed based on quota
 */
export async function checkQuota(
  schoolId: string,
  fileSize: bigint
): Promise<QuotaCheckResult> {
  const status = await getQuotaStatus(schoolId);

  // Check if at storage limit
  if (status.isAtLimit) {
    return {
      allowed: false,
      reason: "Storage quota exceeded. Please upgrade your plan or delete old files.",
      currentUsage: status.usedStorage,
      limit: status.totalStorageLimit,
      availableSpace: BigInt(0),
    };
  }

  // Check if this upload would exceed storage limit
  if (status.usedStorage + fileSize > status.totalStorageLimit) {
    return {
      allowed: false,
      reason: `This upload would exceed your storage limit. Available space: ${formatBytes(status.availableStorage)}, required: ${formatBytes(fileSize)}.`,
      currentUsage: status.usedStorage,
      limit: status.totalStorageLimit,
      availableSpace: status.availableStorage,
    };
  }

  // Check if file exceeds max file size
  if (fileSize > status.maxFileSize) {
    return {
      allowed: false,
      reason: `File too large. Maximum file size: ${formatBytes(status.maxFileSize)}, your file: ${formatBytes(fileSize)}.`,
      currentUsage: status.usedStorage,
      limit: status.maxFileSize,
    };
  }

  // Check daily upload limit
  if (status.dailyUploadUsed + fileSize > status.dailyUploadLimit) {
    return {
      allowed: false,
      reason: `Daily upload limit exceeded. Limit resets at ${status.dailyResetAt.toLocaleTimeString()}. Available today: ${formatBytes(status.dailyUploadAvailable)}.`,
      currentUsage: status.dailyUploadUsed,
      limit: status.dailyUploadLimit,
      availableSpace: status.dailyUploadAvailable,
    };
  }

  // Check file count limit
  if (status.currentFiles >= status.maxFiles) {
    return {
      allowed: false,
      reason: `Maximum number of files reached (${status.maxFiles}). Please delete old files before uploading new ones.`,
      currentUsage: BigInt(status.currentFiles),
      limit: BigInt(status.maxFiles),
    };
  }

  return {
    allowed: true,
    currentUsage: status.usedStorage,
    limit: status.totalStorageLimit,
    availableSpace: status.availableStorage,
  };
}

/**
 * Increment storage usage after successful upload
 */
export async function incrementUsage(
  schoolId: string,
  fileSize: bigint
): Promise<void> {
  await db.uploadQuota.update({
    where: { schoolId },
    data: {
      usedStorage: { increment: fileSize },
      dailyUploadUsed: { increment: fileSize },
      currentFiles: { increment: 1 },
    },
  });

  // Check if quota warning should be sent
  const status = await getQuotaStatus(schoolId);
  if (status.isNearLimit && !status.isAtLimit) {
    await sendQuotaWarning(schoolId, status);
  }
}

/**
 * Decrement storage usage after file deletion
 */
export async function decrementUsage(
  schoolId: string,
  fileSize: bigint
): Promise<void> {
  await db.uploadQuota.update({
    where: { schoolId },
    data: {
      usedStorage: { decrement: fileSize },
      currentFiles: { decrement: 1 },
    },
  });
}

/**
 * Reset daily quota (runs automatically at midnight)
 */
export async function resetDailyQuota(schoolId: string): Promise<void> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  await db.uploadQuota.update({
    where: { schoolId },
    data: {
      dailyUploadUsed: BigInt(0),
      dailyResetAt: tomorrow,
    },
  });
}

/**
 * Reset all daily quotas (cron job)
 */
export async function resetAllDailyQuotas(): Promise<void> {
  const now = new Date();
  const quotasToReset = await db.uploadQuota.findMany({
    where: {
      dailyResetAt: {
        lte: now,
      },
    },
    select: { schoolId: true },
  });

  await Promise.all(
    quotasToReset.map((quota) => resetDailyQuota(quota.schoolId))
  );
}

/**
 * Update quota limits (admin function)
 */
export async function updateQuotaLimits(
  schoolId: string,
  limits: {
    totalStorageLimit?: bigint;
    maxFileSize?: bigint;
    dailyUploadLimit?: bigint;
    uploadsPerHour?: number;
    uploadsPerDay?: number;
    maxFiles?: number;
  }
): Promise<void> {
  await db.uploadQuota.update({
    where: { schoolId },
    data: limits,
  });
}

/**
 * Recalculate actual storage usage from database
 * Use this to fix discrepancies
 */
export async function recalculateUsage(schoolId: string): Promise<void> {
  const result = await db.fileMetadata.aggregate({
    where: {
      schoolId,
      status: "ACTIVE", // Only count active files
    },
    _sum: {
      size: true,
    },
    _count: true,
  });

  const actualUsage = result._sum.size || BigInt(0);
  const actualCount = result._count;

  await db.uploadQuota.update({
    where: { schoolId },
    data: {
      usedStorage: actualUsage,
      currentFiles: actualCount,
    },
  });
}

/**
 * Get quota statistics for lab
 */
export async function getQuotaStats(schoolId: string) {
  const status = await getQuotaStatus(schoolId);

  return {
    storage: {
      used: formatBytes(status.usedStorage),
      total: formatBytes(status.totalStorageLimit),
      percent: Math.round(status.storageUsagePercent * 100),
      available: formatBytes(status.availableStorage),
    },
    daily: {
      used: formatBytes(status.dailyUploadUsed),
      total: formatBytes(status.dailyUploadLimit),
      percent: Math.round(status.dailyUploadUsagePercent * 100),
      available: formatBytes(status.dailyUploadAvailable),
      resetsAt: status.dailyResetAt,
    },
    files: {
      current: status.currentFiles,
      max: status.maxFiles,
      percent: Math.round((status.currentFiles / status.maxFiles) * 100),
      available: status.availableFiles,
    },
    limits: {
      maxFileSize: formatBytes(status.maxFileSize),
      uploadsPerHour: status.uploadsPerHour,
      uploadsPerDay: status.uploadsPerDay,
    },
    status: {
      isNearLimit: status.isNearLimit,
      isAtLimit: status.isAtLimit,
      warningThreshold: Math.round(status.warningThreshold * 100),
    },
  };
}

/**
 * Send quota warning notification
 * Called when usage exceeds warning threshold
 */
async function sendQuotaWarning(
  schoolId: string,
  status: QuotaStatus
): Promise<void> {
  // Check if warning was already sent recently
  const quota = await db.uploadQuota.findUnique({
    where: { schoolId },
    select: { lastWarningAt: true },
  });

  const now = new Date();
  if (
    quota?.lastWarningAt &&
    now.getTime() - quota.lastWarningAt.getTime() < 24 * 60 * 60 * 1000
  ) {
    // Warning sent in last 24 hours, don't spam
    return;
  }

  // Update last warning timestamp
  await db.uploadQuota.update({
    where: { schoolId },
    data: { lastWarningAt: now },
  });

  // TODO: Send notification to school admins
  // This would integrate with your notification system
  console.log(`[QUOTA WARNING] School ${schoolId} at ${Math.round(status.storageUsagePercent * 100)}% storage usage`);
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: bigint): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = Number(bytes);
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Get quota usage by file category
 */
export async function getQuotaByCategory(schoolId: string) {
  const files = await db.fileMetadata.groupBy({
    by: ["category"],
    where: {
      schoolId,
      status: "ACTIVE",
    },
    _sum: {
      size: true,
    },
    _count: true,
  });

  return files.map((file) => ({
    category: file.category,
    size: file._sum.size || BigInt(0),
    sizeFormatted: formatBytes(file._sum.size || BigInt(0)),
    count: file._count,
  }));
}

/**
 * Get quota usage by storage tier
 */
export async function getQuotaByTier(schoolId: string) {
  const files = await db.fileMetadata.groupBy({
    by: ["storageTier"],
    where: {
      schoolId,
      status: "ACTIVE",
    },
    _sum: {
      size: true,
    },
    _count: true,
  });

  return files.map((file) => ({
    tier: file.storageTier,
    size: file._sum.size || BigInt(0),
    sizeFormatted: formatBytes(file._sum.size || BigInt(0)),
    count: file._count,
  }));
}
