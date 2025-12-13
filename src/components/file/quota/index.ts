/**
 * Quota Module
 * Storage quota management for multi-tenant file system
 */

// Actions (server-side)
export {
  getSchoolQuota,
  getQuotaStatus,
  checkQuota,
  incrementUsage,
  decrementUsage,
  resetDailyQuota,
  resetAllDailyQuotas,
  updateQuotaLimits,
  recalculateUsage,
  getQuotaStats,
  getQuotaByCategory,
  getQuotaByTier,
} from "./actions";

// Constants
export { DEFAULT_QUOTA, QUOTA_TIERS } from "./constants";
export type { QuotaTier } from "./constants";

// Types
export type {
  QuotaStatus,
  QuotaCheckResult,
  QuotaStats,
  QuotaByCategory,
  QuotaByTier,
  QuotaLimits,
} from "./types";
