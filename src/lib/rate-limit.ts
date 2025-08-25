import { NextRequest } from 'next/server';

/**
 * Rate limiting utilities for API endpoints
 * Uses in-memory storage for simplicity - consider Redis for production scaling
 */

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

// In-memory storage for rate limiting (consider Redis for production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Predefined rate limit configurations
export const RATE_LIMITS = {
  // Authentication endpoints - strict limits
  AUTH: { windowMs: 60 * 1000, maxRequests: 5 },  // 5 requests per minute
  
  // Onboarding actions - moderate limits
  ONBOARDING: { windowMs: 60 * 1000, maxRequests: 10 },  // 10 requests per minute
  
  // General API endpoints - generous limits
  API: { windowMs: 60 * 1000, maxRequests: 100 },  // 100 requests per minute
  
  // Admin endpoints - moderate limits
  ADMIN: { windowMs: 60 * 1000, maxRequests: 50 },  // 50 requests per minute
  
  // Debug endpoints - very strict (only for DEVELOPER role)
  DEBUG: { windowMs: 60 * 1000, maxRequests: 20 },  // 20 requests per minute
  
  // Public endpoints - moderate limits
  PUBLIC: { windowMs: 60 * 1000, maxRequests: 30 },  // 30 requests per minute
} as const;

/**
 * Create a unique identifier for rate limiting
 */
function createRateLimitKey(request: NextRequest, prefix: string): string {
  // Use IP address as the primary identifier
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') ||
             request.headers.get('cf-connecting-ip') ||
             'unknown';
  
  // Include user agent to prevent abuse from same IP
  const userAgent = request.headers.get('user-agent')?.slice(0, 50) || 'unknown';
  
  return `${prefix}:${ip}:${userAgent}`;
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  request: NextRequest, 
  config: RateLimitConfig,
  prefix: string = 'api'
): { allowed: boolean; remaining: number; resetTime: number } {
  const key = createRateLimitKey(request, prefix);
  const now = Date.now();
  const windowStart = now - config.windowMs;
  
  // Clean up expired entries
  cleanupExpiredEntries(windowStart);
  
  const entry = rateLimitStore.get(key);
  const resetTime = now + config.windowMs;
  
  if (!entry || entry.resetTime <= now) {
    // First request or window expired
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime
    };
  }
  
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }
  
  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);
  
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Clean up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries(windowStart: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= windowStart) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(
  limit: number, 
  remaining: number, 
  resetTime: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),  // Unix timestamp
  };
}

/**
 * Create a standardized rate limit exceeded response
 */
export function createRateLimitResponse(resetTime: number): Response {
  const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter,
      timestamp: new Date().toISOString()
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        ...createRateLimitHeaders(0, 0, resetTime)
      }
    }
  );
}

/**
 * Middleware wrapper to apply rate limiting to API routes
 */
export function withRateLimit<T extends any[]>(
  config: RateLimitConfig,
  prefix: string = 'api'
) {
  return function (
    handler: (request: NextRequest, ...args: T) => Promise<Response>
  ) {
    return async function (request: NextRequest, ...args: T): Promise<Response> {
      const rateLimitResult = checkRateLimit(request, config, prefix);
      
      if (!rateLimitResult.allowed) {
        console.warn('Rate limit exceeded:', {
          ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') ||
              request.headers.get('cf-connecting-ip') ||
              'unknown',
          path: new URL(request.url).pathname,
          timestamp: new Date().toISOString()
        });
        
        return createRateLimitResponse(rateLimitResult.resetTime);
      }
      
      // Call the original handler
      const response = await handler(request, ...args);
      
      // Add rate limit headers to successful responses
      const rateLimitHeaders = createRateLimitHeaders(
        config.maxRequests,
        rateLimitResult.remaining,
        rateLimitResult.resetTime
      );
      
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;
    };
  };
}

/**
 * Simple rate limiter for inline use
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  prefix: string = 'api'
): Promise<Response | null> {
  const result = checkRateLimit(request, config, prefix);
  
  if (!result.allowed) {
    console.warn('Rate limit exceeded:', {
      ip: request.headers.get('x-forwarded-for')?.split(',')[0] || 
          request.headers.get('x-real-ip') ||
          request.headers.get('cf-connecting-ip') ||
          'unknown',
      path: new URL(request.url).pathname,
      timestamp: new Date().toISOString()
    });
    
    return createRateLimitResponse(result.resetTime);
  }
  
  return null; // No rate limit exceeded
}