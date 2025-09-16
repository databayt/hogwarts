/**
 * Cache Service
 * Implements caching strategies for static content, API responses, and database queries
 */

import { unstable_cache } from 'next/cache';
import { logger } from './logger';
import { performanceMonitor } from './performance-monitor';

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  tags?: string[];
  revalidate?: number;
}

class CacheService {
  private memoryCache = new Map<string, { data: any; expires: number }>();

  /**
   * Get from cache with fallback
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = { ttl: 60 }
  ): Promise<T> {
    const startTime = performance.now();

    // Check memory cache first
    const cached = this.getFromMemory(key);
    if (cached !== null) {
      performanceMonitor.recordMetric('cache_hit', performance.now() - startTime, 'ms', {
        key,
        source: 'memory',
      });
      return cached;
    }

    // Fetch and cache
    try {
      const data = await fetcher();
      this.setInMemory(key, data, config.ttl);

      performanceMonitor.recordMetric('cache_miss', performance.now() - startTime, 'ms', {
        key,
        ttl: config.ttl,
      });

      return data;
    } catch (error) {
      logger.error('Cache fetch error', error instanceof Error ? error : new Error('Unknown error'), {
        action: 'cache_fetch_error',
        key,
      });
      throw error;
    }
  }

  /**
   * Get from memory cache
   */
  private getFromMemory(key: string): any | null {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    this.memoryCache.delete(key);
    return null;
  }

  /**
   * Set in memory cache
   */
  private setInMemory(key: string, data: any, ttl: number): void {
    this.memoryCache.set(key, {
      data,
      expires: Date.now() + ttl * 1000,
    });

    // Cleanup expired entries periodically
    if (this.memoryCache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Invalidate cache by key or pattern
   */
  invalidate(pattern: string | RegExp): number {
    let invalidated = 0;
    const keys = Array.from(this.memoryCache.keys());

    for (const key of keys) {
      if (typeof pattern === 'string' ? key === pattern : pattern.test(key)) {
        this.memoryCache.delete(key);
        invalidated++;
      }
    }

    logger.info('Cache invalidated', {
      action: 'cache_invalidate',
      pattern: pattern.toString(),
      invalidated,
    });

    return invalidated;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    const size = this.memoryCache.size;
    this.memoryCache.clear();
    logger.info('Cache cleared', {
      action: 'cache_clear',
      cleared: size,
    });
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expires <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Cache cleanup', {
        action: 'cache_cleanup',
        cleaned,
        remaining: this.memoryCache.size,
      });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    return {
      size: this.memoryCache.size,
      keys: Array.from(this.memoryCache.keys()),
      memoryUsage: JSON.stringify(Array.from(this.memoryCache.values())).length,
    };
  }
}

// Create singleton instance
export const cacheService = new CacheService();

/**
 * Cache wrapper for Next.js unstable_cache
 */
export function cachedFetch<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options?: {
    revalidate?: number;
    tags?: string[];
  }
): () => Promise<T> {
  return unstable_cache(
    fn,
    keyParts,
    {
      revalidate: options?.revalidate ?? 3600, // 1 hour default
      tags: options?.tags,
    }
  );
}

/**
 * Cache wrapper for database queries
 */
export async function cachedQuery<T>(
  key: string,
  query: () => Promise<T>,
  ttl: number = 60
): Promise<T> {
  return cacheService.get(key, query, { ttl });
}

/**
 * Cache wrapper for API responses
 */
export function withCache<T>(
  handler: (req: Request) => Promise<T>,
  config?: CacheConfig
): (req: Request) => Promise<T> {
  return async (req: Request) => {
    const url = new URL(req.url);
    const cacheKey = `api:${url.pathname}:${url.search}`;

    return cacheService.get(
      cacheKey,
      () => handler(req),
      config || { ttl: 60 }
    );
  };
}

/**
 * Revalidate cache by tag
 */
export async function revalidateTag(tag: string): Promise<void> {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/revalidate?tag=${tag}`, {
      method: 'POST',
    });
    logger.info('Cache tag revalidated', {
      action: 'cache_revalidate',
      tag,
    });
  } catch (error) {
    logger.error('Cache revalidation failed', error instanceof Error ? error : new Error('Unknown error'), {
      action: 'cache_revalidate_error',
      tag,
    });
  }
}

/**
 * Cache headers for static assets
 */
export function getCacheHeaders(maxAge: number = 3600, sMaxAge?: number): HeadersInit {
  const headers: HeadersInit = {
    'Cache-Control': `public, max-age=${maxAge}${sMaxAge ? `, s-maxage=${sMaxAge}` : ''}, stale-while-revalidate=59`,
  };

  if (process.env.NODE_ENV === 'production') {
    headers['CDN-Cache-Control'] = `max-age=${sMaxAge || maxAge}`;
  }

  return headers;
}

// Export convenience functions
export const cache = {
  get: <T>(key: string, fetcher: () => Promise<T>, config?: CacheConfig) =>
    cacheService.get(key, fetcher, config),
  invalidate: (pattern: string | RegExp) => cacheService.invalidate(pattern),
  clear: () => cacheService.clear(),
  stats: () => cacheService.getStats(),
};

// Auto-cleanup expired entries every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => {
    const stats = cacheService.getStats();
    if (stats.size > 0) {
      logger.debug('Cache auto-cleanup', {
        action: 'cache_auto_cleanup',
        size: stats.size,
      });
    }
  }, 5 * 60 * 1000);
}