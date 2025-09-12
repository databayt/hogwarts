/**
 * Onboarding Flow Optimization Utilities
 * Prevents excessive API calls and session validations during onboarding
 */

import { unstable_cache } from 'next/cache';

// Cache duration constants (in seconds)
const CACHE_DURATIONS = {
  SESSION: 300, // 5 minutes - session data doesn't change frequently
  SCHOOL_DATA: 60, // 1 minute - school data might be updated during onboarding
  USER_SCHOOLS: 120, // 2 minutes - list of schools for a user
  SETUP_STATUS: 30, // 30 seconds - setup status changes more frequently
} as const;

// Cache tags for invalidation
export const CACHE_TAGS = {
  SESSION: (userId: string) => `session-${userId}`,
  SCHOOL: (schoolId: string) => `school-${schoolId}`,
  USER_SCHOOLS: (userId: string) => `user-schools-${userId}`,
  ONBOARDING: (schoolId: string) => `onboarding-${schoolId}`,
} as const;

/**
 * Debounce function to prevent rapid successive calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;
  
  const debounced = function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
  
  debounced.cancel = () => {
    clearTimeout(timeoutId);
  };
  
  return debounced;
}

/**
 * Rate limiter for API calls
 */
class RateLimiter {
  private lastCall: Map<string, number> = new Map();
  private minInterval: number;

  constructor(minIntervalMs: number = 1000) {
    this.minInterval = minIntervalMs;
  }

  async throttle<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const lastCallTime = this.lastCall.get(key) || 0;
    const timeSinceLastCall = now - lastCallTime;

    if (timeSinceLastCall < this.minInterval) {
      // Wait for the remaining time before making the call
      await new Promise(resolve => 
        setTimeout(resolve, this.minInterval - timeSinceLastCall)
      );
    }

    this.lastCall.set(key, Date.now());
    return fn();
  }
}

export const onboardingRateLimiter = new RateLimiter(500); // 500ms between calls

/**
 * Session cache wrapper to prevent excessive session validations
 */
export const getCachedSession = unstable_cache(
  async (sessionFn: () => Promise<any>) => {
    return await sessionFn();
  },
  ['session-cache'],
  {
    revalidate: CACHE_DURATIONS.SESSION,
    tags: ['session'],
  }
);

/**
 * School data cache wrapper
 */
export const getCachedSchoolData = unstable_cache(
  async (schoolId: string, fetchFn: () => Promise<any>) => {
    return await fetchFn();
  },
  ['school-data-cache'],
  {
    revalidate: CACHE_DURATIONS.SCHOOL_DATA,
    tags: ['school-data'],
  }
);

/**
 * Batch multiple API calls into a single request
 */
export class BatchProcessor<T> {
  private batch: Array<{ resolve: (value: T) => void; reject: (error: any) => void; args: any[] }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchDelay: number;
  private processFn: (items: any[]) => Promise<T[]>;

  constructor(
    processFn: (items: any[]) => Promise<T[]>,
    batchSize = 10,
    batchDelay = 50
  ) {
    this.processFn = processFn;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }

  async add(...args: any[]): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({ resolve, reject, args });

      if (this.batch.length >= this.batchSize) {
        this.processBatch();
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatch(), this.batchDelay);
      }
    });
  }

  private async processBatch() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const currentBatch = this.batch.splice(0, this.batchSize);
    if (currentBatch.length === 0) return;

    try {
      const results = await this.processFn(currentBatch.map(item => item.args));
      currentBatch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      currentBatch.forEach(item => {
        item.reject(error);
      });
    }
  }
}

/**
 * Optimized fetch with retry logic
 */
export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }
      
      // Exponential backoff
      if (i < maxRetries - 1) {
        await new Promise(resolve => 
          setTimeout(resolve, backoffMs * Math.pow(2, i))
        );
      }
    }
  }
  
  throw lastError;
}

/**
 * Memory cache for frequently accessed data
 */
export class MemoryCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();
  private defaultTTL: number;

  constructor(defaultTTLSeconds = 60) {
    this.defaultTTL = defaultTTLSeconds * 1000;
  }

  get(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }

  set(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL;
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

// Singleton instances
export const sessionCache = new MemoryCache(CACHE_DURATIONS.SESSION);
export const schoolCache = new MemoryCache(CACHE_DURATIONS.SCHOOL_DATA);

/**
 * Optimize onboarding data fetching
 */
export async function getOptimizedOnboardingData(
  schoolId: string,
  fetchFns: {
    getSchool: () => Promise<any>;
    getStatus: () => Promise<any>;
  }
): Promise<{ school: any; status: any }> {
  // Check memory cache first
  const cacheKey = `onboarding-${schoolId}`;
  const cached = schoolCache.get(cacheKey);
  if (cached) {
    return cached as { school: any; status: any };
  }

  // Fetch data with rate limiting
  const [school, status] = await Promise.all([
    onboardingRateLimiter.throttle(`school-${schoolId}`, fetchFns.getSchool),
    onboardingRateLimiter.throttle(`status-${schoolId}`, fetchFns.getStatus),
  ]);

  const result = { school, status };
  
  // Cache the result
  schoolCache.set(cacheKey, result, CACHE_DURATIONS.SCHOOL_DATA);
  
  return result;
}