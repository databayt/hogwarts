/**
 * Exam System Caching Strategy - LRU Cache Implementation
 *
 * PURPOSE: In-memory caching for frequently accessed exam-related data
 * Reduces database load for read-heavy operations (grade boundaries, school info)
 *
 * CACHED DATA:
 * 1. Grade boundaries: School's grading scale (e.g., A=90+, B=80+)
 *    TTL: 30 minutes (rarely changes, safe to cache)
 * 2. School branding: Logo, colors, fonts (very stable)
 *    TTL: 1 hour (almost never changes)
 * 3. School info: Basic school record
 *    TTL: 1 hour
 * 4. Question analytics: Aggregated question performance metrics
 *    TTL: 10 minutes (changes frequently, shorter cache)
 *
 * ALGORITHM: LRU (Least Recently Used)
 * - When cache is full, evicts oldest-accessed entry
 * - Recently accessed entries move to front of queue
 * - get() moves entry to front (marking as recently used)
 * - set() adds at front (most recently set)
 *
 * EXPIRATION STRATEGIES:
 * 1. TTL-based: Each entry expires after X milliseconds
 * 2. Manual invalidation: Call invalidate() to remove specific key
 * 3. Pattern invalidation: Use regex to invalidate by pattern
 * 4. Periodic cleanup: Auto-cleanup every 5 minutes (server-side only)
 *
 * ARCHITECTURE:
 * - Generic LRUCache<T> class (reusable)
 * - Specialized instances: gradeBoundaryCache, schoolBrandingCache, etc.
 * - Singleton per cache type (one per application instance)
 * - In-memory storage (lost on restart)
 *
 * KEY PATTERNS:
 * - warmCache.preload(): Pre-load frequently accessed data at startup
 * - withCache(): HOF wrapper for async functions with auto-caching
 * - cacheKeys: Centralized key generation (format: entity:id)
 * - invalidateCache.all(): Bulk invalidation for school updates
 *
 * CONSTRAINTS & GOTCHAS:
 * - CRITICAL: In-memory only (not shared across processes/servers)
 *   Don't use in multi-process environment without Redis
 * - TTL check only on get() (expired entries persist until accessed)
 * - Manual cleanup() needed to free memory immediately
 * - Cache poisoning: If DB query fails, don't cache error result
 * - No cache coherence across replicas (stale data possible)
 *
 * GOTCHAS:
 * - withCache() only caches successful results (result.success check)
 * - Cleanup runs on interval (can't be manually cancelled)
 * - Max size limits apply per cache instance, not globally
 * - Pattern invalidation uses RegExp (escaping needed for special chars)
 *
 * PERFORMANCE:
 * - get/set/invalidate: O(1) average (Map operations)
 * - Cleanup: O(n) where n = entries in cache
 * - Pattern invalidation: O(n) (linear scan for regex matching)
 *
 * MONITORING:
 * - getStats(): Returns cache size, max size, age, TTL for each entry
 * - Use for cache hit rate calculation and optimization
 */

import { GradeBoundary, SchoolBranding, School } from "@prisma/client";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Get item from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to front (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  /**
   * Set item in cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate keys matching pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        age: Date.now() - entry.timestamp,
        ttl: entry.ttl,
      })),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Cache instances with different TTLs
export const gradeBoundaryCache = new LRUCache<GradeBoundary[]>({
  ttl: 30 * 60 * 1000, // 30 minutes (rarely changes)
  maxSize: 50,
});

export const schoolBrandingCache = new LRUCache<SchoolBranding>({
  ttl: 60 * 60 * 1000, // 1 hour (very rarely changes)
  maxSize: 20,
});

export const schoolCache = new LRUCache<School>({
  ttl: 60 * 60 * 1000, // 1 hour
  maxSize: 20,
});

export const questionAnalyticsCache = new LRUCache<any>({
  ttl: 10 * 60 * 1000, // 10 minutes (changes more frequently)
  maxSize: 200,
});

// Periodic cleanup of expired entries (every 5 minutes)
if (typeof window === "undefined") {
  setInterval(() => {
    gradeBoundaryCache.cleanup();
    schoolBrandingCache.cleanup();
    schoolCache.cleanup();
    questionAnalyticsCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  gradeBoundaries: (schoolId: string) => `grade-boundaries:${schoolId}`,
  schoolBranding: (schoolId: string) => `school-branding:${schoolId}`,
  school: (schoolId: string) => `school:${schoolId}`,
  questionAnalytics: (schoolId: string, questionId: string) =>
    `question-analytics:${schoolId}:${questionId}`,
  examAnalytics: (schoolId: string, examId: string) =>
    `exam-analytics:${schoolId}:${examId}`,
};

/**
 * Cache invalidation helpers
 */
export const invalidateCache = {
  gradeBoundaries: (schoolId: string) => {
    gradeBoundaryCache.invalidate(cacheKeys.gradeBoundaries(schoolId));
  },

  schoolBranding: (schoolId: string) => {
    schoolBrandingCache.invalidate(cacheKeys.schoolBranding(schoolId));
  },

  school: (schoolId: string) => {
    schoolCache.invalidate(cacheKeys.school(schoolId));
  },

  questionAnalytics: (schoolId: string, questionId?: string) => {
    if (questionId) {
      questionAnalyticsCache.invalidate(
        cacheKeys.questionAnalytics(schoolId, questionId)
      );
    } else {
      // Invalidate all question analytics for the school
      questionAnalyticsCache.invalidatePattern(`question-analytics:${schoolId}:`);
    }
  },

  examAnalytics: (schoolId: string, examId?: string) => {
    if (examId) {
      questionAnalyticsCache.invalidate(
        cacheKeys.examAnalytics(schoolId, examId)
      );
    } else {
      // Invalidate all exam analytics for the school
      questionAnalyticsCache.invalidatePattern(`exam-analytics:${schoolId}:`);
    }
  },

  all: (schoolId: string) => {
    // Invalidate all caches for a school
    invalidateCache.gradeBoundaries(schoolId);
    invalidateCache.schoolBranding(schoolId);
    invalidateCache.school(schoolId);
    invalidateCache.questionAnalytics(schoolId);
    invalidateCache.examAnalytics(schoolId);
  },
};

/**
 * Cache warming strategies
 */
export const warmCache = {
  /**
   * Pre-load frequently accessed data
   */
  async preload(schoolId: string, db: any) {
    try {
      // Pre-load grade boundaries
      const boundaries = await db.gradeBoundary.findMany({
        where: { schoolId },
        orderBy: { minScore: "desc" },
      });

      if (boundaries.length > 0) {
        gradeBoundaryCache.set(
          cacheKeys.gradeBoundaries(schoolId),
          boundaries,
          60 * 60 * 1000 // 1 hour for pre-loaded data
        );
      }

      // Pre-load school branding
      const branding = await db.schoolBranding.findUnique({
        where: { schoolId },
      });

      if (branding) {
        schoolBrandingCache.set(
          cacheKeys.schoolBranding(schoolId),
          branding,
          2 * 60 * 60 * 1000 // 2 hours for pre-loaded data
        );
      }

      // Pre-load school info
      const school = await db.school.findUnique({
        where: { id: schoolId },
      });

      if (school) {
        schoolCache.set(
          cacheKeys.school(schoolId),
          school,
          2 * 60 * 60 * 1000 // 2 hours
        );
      }
    } catch (error) {
      console.error("Cache warming failed:", error);
      // Non-critical error, continue without cache
    }
  },
};

/**
 * Cache middleware for server actions
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getCacheKey: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
): T {
  const cache = new LRUCache<Awaited<ReturnType<T>>>(options);

  return (async (...args: Parameters<T>) => {
    const key = getCacheKey(...args);

    // Check cache first
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);

    // Only cache successful results
    if (result && result.success) {
      cache.set(key, result);
    }

    return result;
  }) as T;
}