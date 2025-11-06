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

  // Geolocation endpoints - high frequency allowed (student location tracking)
  GEO_LOCATION: { windowMs: 10 * 1000, maxRequests: 20 },  // 20 requests per 10 seconds

  // Stream endpoints - file upload/delete limits
  STREAM_UPLOAD: { windowMs: 60 * 1000, maxRequests: 10 },  // 10 uploads per minute
  STREAM_ENROLLMENT: { windowMs: 60 * 1000, maxRequests: 5 },  // 5 enrollments per minute
  STREAM_API: { windowMs: 60 * 1000, maxRequests: 60 },  // 60 requests per minute

  // Messaging endpoints - prevent spam
  MESSAGE_SEND: { windowMs: 60 * 1000, maxRequests: 10 },  // 10 messages per minute per user
  MESSAGE_BURST: { windowMs: 10 * 1000, maxRequests: 5 },  // 5 messages per 10 seconds (burst protection)
  MESSAGE_FILE_UPLOAD: { windowMs: 10 * 60 * 1000, maxRequests: 10 },  // 10 files per 10 minutes
  MESSAGE_REACTION: { windowMs: 60 * 1000, maxRequests: 30 },  // 30 reactions per minute
  MESSAGE_TYPING: { windowMs: 10 * 1000, maxRequests: 3 },  // 3 typing indicators per 10 seconds
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

/**
 * Messaging-specific rate limiting functions
 * Uses user ID and conversation ID for more granular control
 */

interface MessageRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number; // Seconds until next allowed request
}

/**
 * Check rate limit for message sending
 * Applies both per-user and burst protection limits
 */
export function checkMessageSendRateLimit(
  userId: string,
  conversationId: string,
  schoolId: string
): MessageRateLimitResult {
  const now = Date.now();

  // Check per-user message limit (10 messages per minute)
  const userKey = `message:user:${userId}:school:${schoolId}`;
  const userResult = checkRateLimitByKey(userKey, RATE_LIMITS.MESSAGE_SEND);

  if (!userResult.allowed) {
    return {
      allowed: false,
      limit: userResult.limit,
      remaining: userResult.remaining,
      resetTime: userResult.resetTime,
      retryAfter: Math.ceil((userResult.resetTime - now) / 1000)
    };
  }

  // Check burst protection (5 messages per 10 seconds in same conversation)
  const burstKey = `message:burst:${userId}:${conversationId}`;
  const burstResult = checkRateLimitByKey(burstKey, RATE_LIMITS.MESSAGE_BURST);

  if (!burstResult.allowed) {
    return {
      allowed: false,
      limit: burstResult.limit,
      remaining: burstResult.remaining,
      resetTime: burstResult.resetTime,
      retryAfter: Math.ceil((burstResult.resetTime - now) / 1000)
    };
  }

  // Both limits passed
  return {
    allowed: true,
    limit: Math.min(userResult.limit, burstResult.limit),
    remaining: Math.min(userResult.remaining, burstResult.remaining),
    resetTime: Math.max(userResult.resetTime, burstResult.resetTime)
  };
}

/**
 * Check rate limit for file uploads in messages
 */
export function checkMessageFileUploadRateLimit(
  userId: string,
  schoolId: string
): MessageRateLimitResult {
  const now = Date.now();
  const key = `message:file:${userId}:school:${schoolId}`;
  const result = checkRateLimitByKey(key, RATE_LIMITS.MESSAGE_FILE_UPLOAD);

  return {
    allowed: result.allowed,
    limit: result.limit,
    remaining: result.remaining,
    resetTime: result.resetTime,
    retryAfter: result.allowed ? undefined : Math.ceil((result.resetTime - now) / 1000)
  };
}

/**
 * Check rate limit for message reactions
 */
export function checkMessageReactionRateLimit(
  userId: string,
  schoolId: string
): MessageRateLimitResult {
  const now = Date.now();
  const key = `message:reaction:${userId}:school:${schoolId}`;
  const result = checkRateLimitByKey(key, RATE_LIMITS.MESSAGE_REACTION);

  return {
    allowed: result.allowed,
    limit: result.limit,
    remaining: result.remaining,
    resetTime: result.resetTime,
    retryAfter: result.allowed ? undefined : Math.ceil((result.resetTime - now) / 1000)
  };
}

/**
 * Check rate limit for typing indicators
 */
export function checkTypingIndicatorRateLimit(
  userId: string,
  conversationId: string
): MessageRateLimitResult {
  const now = Date.now();
  const key = `message:typing:${userId}:${conversationId}`;
  const result = checkRateLimitByKey(key, RATE_LIMITS.MESSAGE_TYPING);

  return {
    allowed: result.allowed,
    limit: result.limit,
    remaining: result.remaining,
    resetTime: result.resetTime,
    retryAfter: result.allowed ? undefined : Math.ceil((result.resetTime - now) / 1000)
  };
}

/**
 * Internal helper to check rate limit by key
 */
function checkRateLimitByKey(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; limit: number; remaining: number; resetTime: number } {
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
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime
    };
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * Create a user-friendly rate limit error message
 */
export function createRateLimitErrorMessage(result: MessageRateLimitResult): string {
  if (result.allowed) {
    return '';
  }

  const retryInSeconds = result.retryAfter || 0;

  if (retryInSeconds <= 10) {
    return `Rate limit exceeded. Please wait ${retryInSeconds} seconds before sending another message.`;
  }

  const retryInMinutes = Math.ceil(retryInSeconds / 60);
  return `Rate limit exceeded. Please wait ${retryInMinutes} minute${retryInMinutes > 1 ? 's' : ''} before sending another message.`;
}

/**
 * Clear rate limit for testing purposes
 */
export function clearMessageRateLimit(userId: string, conversationId?: string, schoolId?: string): void {
  const keysToDelete: string[] = [];

  if (conversationId) {
    keysToDelete.push(`message:burst:${userId}:${conversationId}`);
    keysToDelete.push(`message:typing:${userId}:${conversationId}`);
  }

  if (schoolId) {
    keysToDelete.push(`message:user:${userId}:school:${schoolId}`);
    keysToDelete.push(`message:file:${userId}:school:${schoolId}`);
    keysToDelete.push(`message:reaction:${userId}:school:${schoolId}`);
  }

  keysToDelete.forEach(key => rateLimitStore.delete(key));
}