/**
 * Quota Constants
 * Default values for storage quota management
 */

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
} as const

/**
 * Quota tiers for different subscription plans
 */
export const QUOTA_TIERS = {
  FREE: {
    totalStorageLimit: BigInt(1 * 1024 * 1024 * 1024), // 1GB
    maxFileSize: BigInt(100 * 1024 * 1024), // 100MB per file
    dailyUploadLimit: BigInt(100 * 1024 * 1024), // 100MB per day
    uploadsPerHour: 10,
    uploadsPerDay: 50,
    maxFiles: 100,
  },
  STARTER: {
    totalStorageLimit: BigInt(10 * 1024 * 1024 * 1024), // 10GB
    maxFileSize: BigInt(1 * 1024 * 1024 * 1024), // 1GB per file
    dailyUploadLimit: BigInt(1 * 1024 * 1024 * 1024), // 1GB per day
    uploadsPerHour: 50,
    uploadsPerDay: 500,
    maxFiles: 1000,
  },
  PROFESSIONAL: {
    totalStorageLimit: BigInt(100 * 1024 * 1024 * 1024), // 100GB
    maxFileSize: BigInt(5 * 1024 * 1024 * 1024), // 5GB per file
    dailyUploadLimit: BigInt(10 * 1024 * 1024 * 1024), // 10GB per day
    uploadsPerHour: 100,
    uploadsPerDay: 1000,
    maxFiles: 10000,
  },
  ENTERPRISE: {
    totalStorageLimit: BigInt(1024 * 1024 * 1024 * 1024), // 1TB
    maxFileSize: BigInt(10 * 1024 * 1024 * 1024), // 10GB per file
    dailyUploadLimit: BigInt(100 * 1024 * 1024 * 1024), // 100GB per day
    uploadsPerHour: 500,
    uploadsPerDay: 5000,
    maxFiles: 100000,
  },
} as const

export type QuotaTier = keyof typeof QUOTA_TIERS
