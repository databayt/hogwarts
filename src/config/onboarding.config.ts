/**
 * Onboarding Configuration
 * Settings to ensure smooth onboarding in development and production
 */

export const onboardingConfig = {
  // Session configuration
  session: {
    // Reduce session validation frequency
    updateAge: process.env.NODE_ENV === 'production' ? 300 : 60, // 5 min in prod, 1 min in dev
    maxAge: 24 * 60 * 60, // 24 hours
    
    // Disable excessive logging in production
    debug: process.env.NODE_ENV === 'development',
  },

  // API rate limiting
  rateLimit: {
    // Minimum time between API calls (milliseconds)
    minInterval: process.env.NODE_ENV === 'production' ? 500 : 100,
    
    // Max retries for failed requests
    maxRetries: process.env.NODE_ENV === 'production' ? 3 : 2,
    
    // Backoff strategy for retries
    backoffMs: process.env.NODE_ENV === 'production' ? 1000 : 500,
  },

  // Caching configuration
  cache: {
    // Cache durations in seconds
    session: process.env.NODE_ENV === 'production' ? 300 : 60, // 5 min vs 1 min
    schoolData: process.env.NODE_ENV === 'production' ? 120 : 30, // 2 min vs 30 sec
    userSchools: process.env.NODE_ENV === 'production' ? 180 : 60, // 3 min vs 1 min
    setupStatus: process.env.NODE_ENV === 'production' ? 60 : 15, // 1 min vs 15 sec
  },

  // UI optimization
  ui: {
    // Debounce delays for form inputs (milliseconds)
    inputDebounce: process.env.NODE_ENV === 'production' ? 500 : 200,
    
    // Auto-save interval for drafts
    autoSaveInterval: process.env.NODE_ENV === 'production' ? 30000 : 10000, // 30s vs 10s
    
    // Show loading states after this delay
    loadingDelay: process.env.NODE_ENV === 'production' ? 200 : 100,
  },

  // Error handling
  errors: {
    // Show detailed errors in development only
    showDetails: process.env.NODE_ENV === 'development',
    
    // Error reporting threshold (ms) - log slow operations
    performanceThreshold: process.env.NODE_ENV === 'production' ? 3000 : 1000,
  },

  // Performance monitoring
  monitoring: {
    // Enable performance tracking
    enabled: process.env.NODE_ENV === 'production',
    
    // Sample rate for performance metrics (0-1)
    sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  },
}

/**
 * Get optimized fetch options based on environment
 */
export function getOptimizedFetchOptions() {
  return {
    cache: process.env.NODE_ENV === 'production' ? 'default' : 'no-store',
    next: {
      revalidate: onboardingConfig.cache.schoolData,
    },
  }
}

/**
 * Check if we should log debug information
 */
export function shouldLog(level: 'debug' | 'info' | 'warn' | 'error' = 'debug'): boolean {
  if (process.env.NODE_ENV === 'production') {
    return level === 'error' || level === 'warn'
  }
  return true
}

/**
 * Safe console logger that respects environment
 */
export const logger = {
  debug: (...args: any[]) => {
    if (shouldLog('debug')) console.log(...args)
  },
  info: (...args: any[]) => {
    if (shouldLog('info')) console.info(...args)
  },
  warn: (...args: any[]) => {
    if (shouldLog('warn')) console.warn(...args)
  },
  error: (...args: any[]) => {
    if (shouldLog('error')) console.error(...args)
  },
}