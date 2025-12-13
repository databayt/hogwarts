/**
 * Storage Tier Manager
 * Automatically determines optimal storage tier based on file characteristics
 * Optimizes costs by tiering storage (Hot -> Warm -> Cold)
 */

export type StorageTier = "HOT" | "WARM" | "COLD";
export type StorageProvider = "VERCEL_BLOB" | "AWS_S3" | "CLOUDFLARE_R2";

export interface TierConfig {
  // Size thresholds (in bytes)
  hotMaxSize: number; // Files larger than this go to warm/cold
  warmMaxSize: number; // Files larger than this go to cold

  // Age thresholds (in days)
  hotMaxAge: number; // Files older than this move to warm
  warmMaxAge: number; // Files older than this move to cold

  // Access frequency thresholds
  hotMinAccessCount: number; // Files accessed less frequently move to warm
  warmMinAccessCount: number; // Files accessed less frequently move to cold

  // Days since last access
  hotMaxIdleDays: number; // Move to warm if not accessed
  warmMaxIdleDays: number; // Move to cold if not accessed
}

/**
 * Default tier configuration (cost-optimized)
 */
export const DEFAULT_TIER_CONFIG: TierConfig = {
  // Size thresholds
  hotMaxSize: 100 * 1024 * 1024, // 100MB
  warmMaxSize: 500 * 1024 * 1024, // 500MB

  // Age thresholds
  hotMaxAge: 30, // 30 days
  warmMaxAge: 90, // 90 days

  // Access frequency (per 30 days)
  hotMinAccessCount: 10,
  warmMinAccessCount: 2,

  // Idle time
  hotMaxIdleDays: 30, // 30 days
  warmMaxIdleDays: 60, // 60 days
};

/**
 * Get tier configuration from environment or use defaults
 */
export function getTierConfig(): TierConfig {
  return {
    hotMaxSize: parseInt(
      process.env.STORAGE_HOT_MAX_SIZE || String(DEFAULT_TIER_CONFIG.hotMaxSize)
    ),
    warmMaxSize: parseInt(
      process.env.STORAGE_WARM_MAX_SIZE ||
        String(DEFAULT_TIER_CONFIG.warmMaxSize)
    ),
    hotMaxAge: parseInt(
      process.env.STORAGE_HOT_MAX_AGE || String(DEFAULT_TIER_CONFIG.hotMaxAge)
    ),
    warmMaxAge: parseInt(
      process.env.STORAGE_WARM_MAX_AGE || String(DEFAULT_TIER_CONFIG.warmMaxAge)
    ),
    hotMinAccessCount: parseInt(
      process.env.STORAGE_HOT_MIN_ACCESS ||
        String(DEFAULT_TIER_CONFIG.hotMinAccessCount)
    ),
    warmMinAccessCount: parseInt(
      process.env.STORAGE_WARM_MIN_ACCESS ||
        String(DEFAULT_TIER_CONFIG.warmMinAccessCount)
    ),
    hotMaxIdleDays: parseInt(
      process.env.STORAGE_HOT_MAX_IDLE ||
        String(DEFAULT_TIER_CONFIG.hotMaxIdleDays)
    ),
    warmMaxIdleDays: parseInt(
      process.env.STORAGE_WARM_MAX_IDLE ||
        String(DEFAULT_TIER_CONFIG.warmMaxIdleDays)
    ),
  };
}

/**
 * Determine initial storage tier for a new file
 * Based on file size and type
 */
export function determineInitialTier(fileSize: number): StorageTier {
  const config = getTierConfig();

  // Small files go to HOT for fast access
  if (fileSize <= config.hotMaxSize) {
    return "HOT";
  }

  // Medium files go to WARM
  if (fileSize <= config.warmMaxSize) {
    return "WARM";
  }

  // Large files go directly to COLD
  return "COLD";
}

/**
 * Determine storage provider based on tier
 */
export function determineProvider(tier: StorageTier): StorageProvider {
  switch (tier) {
    case "HOT":
      // Vercel Blob for fast access, small files
      return "VERCEL_BLOB";
    case "WARM":
      // S3 Standard for regular access
      return "AWS_S3";
    case "COLD":
      // S3 Glacier or R2 for archival
      return process.env.USE_CLOUDFLARE_R2 === "true"
        ? "CLOUDFLARE_R2"
        : "AWS_S3";
  }
}

export interface FileMetrics {
  fileSize: number; // bytes
  createdAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  currentTier: StorageTier;
}

/**
 * Evaluate if file should be moved to a different tier
 * Returns recommended tier or null if no change needed
 */
export function evaluateTierChange(
  metrics: FileMetrics
): StorageTier | null {
  const config = getTierConfig();
  const now = new Date();
  const ageInDays = (now.getTime() - metrics.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  const daysSinceLastAccess = metrics.lastAccessedAt
    ? (now.getTime() - metrics.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24)
    : ageInDays;

  const currentTier = metrics.currentTier;

  // HOT -> WARM migration conditions
  if (currentTier === "HOT") {
    // Move to WARM if:
    // 1. File is too old
    // 2. Not accessed frequently enough
    // 3. File has been idle too long
    if (
      ageInDays > config.hotMaxAge ||
      metrics.accessCount < config.hotMinAccessCount ||
      daysSinceLastAccess > config.hotMaxIdleDays
    ) {
      return "WARM";
    }
  }

  // WARM -> COLD migration conditions
  if (currentTier === "WARM") {
    // Move to COLD if:
    // 1. File is very old
    // 2. Rarely accessed
    // 3. File has been idle for extended period
    if (
      ageInDays > config.warmMaxAge ||
      metrics.accessCount < config.warmMinAccessCount ||
      daysSinceLastAccess > config.warmMaxIdleDays
    ) {
      return "COLD";
    }
  }

  // COLD -> WARM promotion conditions
  if (currentTier === "COLD") {
    // Promote to WARM if file becomes active again
    if (
      metrics.accessCount >= config.warmMinAccessCount &&
      daysSinceLastAccess < config.warmMaxIdleDays
    ) {
      return "WARM";
    }
  }

  // WARM -> HOT promotion conditions
  if (currentTier === "WARM") {
    // Promote to HOT if:
    // 1. File is accessed frequently
    // 2. File is small enough for HOT
    // 3. Recently accessed
    if (
      metrics.fileSize <= config.hotMaxSize &&
      metrics.accessCount >= config.hotMinAccessCount &&
      daysSinceLastAccess < 7 // accessed in last week
    ) {
      return "HOT";
    }
  }

  return null; // No change needed
}

/**
 * Calculate estimated storage cost per month
 * Based on tier and file size
 */
export function calculateStorageCost(
  fileSize: number,
  tier: StorageTier
): number {
  const sizeInGB = fileSize / (1024 * 1024 * 1024);

  // Approximate costs (USD per GB per month)
  const costPerGB = {
    HOT: 0.15, // Vercel Blob
    WARM: 0.023, // S3 Standard
    COLD: 0.004, // S3 Glacier Instant Retrieval
  };

  return sizeInGB * costPerGB[tier];
}

/**
 * Calculate cost savings from tier optimization
 */
export function calculateTierSavings(
  fileSize: number,
  fromTier: StorageTier,
  toTier: StorageTier
): number {
  const currentCost = calculateStorageCost(fileSize, fromTier);
  const newCost = calculateStorageCost(fileSize, toTier);
  return currentCost - newCost; // Positive = savings, negative = increase
}

/**
 * Get storage path based on tier
 * Organizes files by tenant and tier
 */
export function getStoragePath(
  schoolId: string,
  tier: StorageTier,
  folder: string,
  filename: string
): string {
  const tierPath = tier.toLowerCase();
  // Remove leading slash from folder if present
  const cleanFolder = folder.startsWith("/") ? folder.substring(1) : folder;
  return `${schoolId}/${tierPath}/${cleanFolder}/${filename}`;
}

/**
 * Batch evaluate tier changes for multiple files
 * Returns files that should be migrated
 */
export function batchEvaluateTierChanges(
  files: FileMetrics[]
): Array<{ fileId: string; currentTier: StorageTier; recommendedTier: StorageTier }> {
  const recommendations: Array<{ fileId: string; currentTier: StorageTier; recommendedTier: StorageTier }> = [];

  for (const file of files) {
    const recommendedTier = evaluateTierChange(file);
    if (recommendedTier && recommendedTier !== file.currentTier) {
      recommendations.push({
        fileId: (file as any).id || "", // Type assertion for id
        currentTier: file.currentTier,
        recommendedTier,
      });
    }
  }

  return recommendations;
}

/**
 * Get tier statistics for lab
 */
export interface TierStats {
  tier: StorageTier;
  fileCount: number;
  totalSize: number;
  estimatedMonthlyCost: number;
}

export function calculateTierStats(files: FileMetrics[]): TierStats[] {
  const stats: Record<StorageTier, TierStats> = {
    HOT: { tier: "HOT", fileCount: 0, totalSize: 0, estimatedMonthlyCost: 0 },
    WARM: { tier: "WARM", fileCount: 0, totalSize: 0, estimatedMonthlyCost: 0 },
    COLD: { tier: "COLD", fileCount: 0, totalSize: 0, estimatedMonthlyCost: 0 },
  };

  for (const file of files) {
    const tierStats = stats[file.currentTier];
    tierStats.fileCount++;
    tierStats.totalSize += file.fileSize;
    tierStats.estimatedMonthlyCost += calculateStorageCost(
      file.fileSize,
      file.currentTier
    );
  }

  return Object.values(stats);
}
