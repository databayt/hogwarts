/**
 * Quota Types
 * Type definitions for storage quota management
 */

export interface QuotaStatus {
  schoolId: string
  // Storage
  totalStorageLimit: bigint
  usedStorage: bigint
  availableStorage: bigint
  storageUsagePercent: number
  // Daily upload
  dailyUploadLimit: bigint
  dailyUploadUsed: bigint
  dailyUploadAvailable: bigint
  dailyUploadUsagePercent: number
  dailyResetAt: Date
  // File limits
  maxFileSize: bigint
  maxFiles: number
  currentFiles: number
  availableFiles: number
  // Rate limits
  uploadsPerHour: number
  uploadsPerDay: number
  // Warning status
  isNearLimit: boolean // >80% usage
  isAtLimit: boolean // >=100% usage
  warningThreshold: number
}

export interface QuotaCheckResult {
  allowed: boolean
  reason?: string
  currentUsage?: bigint
  limit?: bigint
  availableSpace?: bigint
}

export interface QuotaStats {
  storage: {
    used: string
    total: string
    percent: number
    available: string
  }
  daily: {
    used: string
    total: string
    percent: number
    available: string
    resetsAt: Date
  }
  files: {
    current: number
    max: number
    percent: number
    available: number
  }
  limits: {
    maxFileSize: string
    uploadsPerHour: number
    uploadsPerDay: number
  }
  status: {
    isNearLimit: boolean
    isAtLimit: boolean
    warningThreshold: number
  }
}

export interface QuotaByCategory {
  category: string
  size: bigint
  sizeFormatted: string
  count: number
}

export interface QuotaByTier {
  tier: string
  size: bigint
  sizeFormatted: string
  count: number
}

export interface QuotaLimits {
  totalStorageLimit?: bigint
  maxFileSize?: bigint
  dailyUploadLimit?: bigint
  uploadsPerHour?: number
  uploadsPerDay?: number
  maxFiles?: number
}
