/**
 * Performance Optimization for 3G Networks
 * Implements strategies for low-bandwidth environments
 */

import { logger } from '@/lib/logger';

export interface NetworkQuality {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // Round-trip time in ms
  saveData: boolean;
}

export interface OptimizationStrategy {
  enableLazyLoading: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  reducedMotion: boolean;
  dataSaver: boolean;
  prefetchLinks: boolean;
  videoAutoplay: boolean;
  chunkSize: 'small' | 'medium' | 'large';
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
}

class PerformanceOptimizer {
  private networkQuality: NetworkQuality | null = null;
  private strategy: OptimizationStrategy = this.getDefaultStrategy();

  constructor() {
    if (typeof window !== 'undefined') {
      this.detectNetworkQuality();
      this.observeNetworkChanges();
    }
  }

  /**
   * Detect current network quality
   */
  private detectNetworkQuality() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      this.networkQuality = {
        effectiveType: connection.effectiveType || '4g',
        downlink: connection.downlink || 10,
        rtt: connection.rtt || 100,
        saveData: connection.saveData || false,
      };

      this.updateStrategy();

      logger.info('Network quality detected', {
        action: 'network_quality_detected',
        ...this.networkQuality,
      });
    }
  }

  /**
   * Observe network changes
   */
  private observeNetworkChanges() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      connection.addEventListener('change', () => {
        this.detectNetworkQuality();
      });
    }
  }

  /**
   * Update optimization strategy based on network
   */
  private updateStrategy() {
    if (!this.networkQuality) {
      this.strategy = this.getDefaultStrategy();
      return;
    }

    const { effectiveType, saveData } = this.networkQuality;

    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        this.strategy = {
          enableLazyLoading: true,
          imageQuality: 'low',
          reducedMotion: true,
          dataSaver: true,
          prefetchLinks: false,
          videoAutoplay: false,
          chunkSize: 'small',
          cacheStrategy: 'aggressive',
        };
        break;

      case '3g':
        this.strategy = {
          enableLazyLoading: true,
          imageQuality: saveData ? 'low' : 'medium',
          reducedMotion: false,
          dataSaver: saveData,
          prefetchLinks: !saveData,
          videoAutoplay: false,
          chunkSize: 'medium',
          cacheStrategy: 'aggressive',
        };
        break;

      case '4g':
      default:
        this.strategy = {
          enableLazyLoading: false,
          imageQuality: saveData ? 'medium' : 'high',
          reducedMotion: false,
          dataSaver: saveData,
          prefetchLinks: !saveData,
          videoAutoplay: !saveData,
          chunkSize: 'large',
          cacheStrategy: 'moderate',
        };
        break;
    }
  }

  /**
   * Get default strategy
   */
  private getDefaultStrategy(): OptimizationStrategy {
    return {
      enableLazyLoading: false,
      imageQuality: 'high',
      reducedMotion: false,
      dataSaver: false,
      prefetchLinks: true,
      videoAutoplay: true,
      chunkSize: 'large',
      cacheStrategy: 'moderate',
    };
  }

  /**
   * Get current strategy
   */
  getStrategy(): OptimizationStrategy {
    return this.strategy;
  }

  /**
   * Get network quality
   */
  getNetworkQuality(): NetworkQuality | null {
    return this.networkQuality;
  }

  /**
   * Check if running on slow connection
   */
  isSlowConnection(): boolean {
    if (!this.networkQuality) return false;

    return ['slow-2g', '2g', '3g'].includes(this.networkQuality.effectiveType) ||
           this.networkQuality.saveData;
  }

  /**
   * Get optimized image URL
   */
  getOptimizedImageUrl(
    originalUrl: string,
    width?: number,
    format: 'auto' | 'webp' | 'jpg' = 'auto'
  ): string {
    const quality = this.getImageQuality();

    // If using Cloudinary
    if (originalUrl.includes('cloudinary.com')) {
      const transformations = [
        `q_${quality}`,
        width ? `w_${width}` : '',
        format === 'auto' ? 'f_auto' : `f_${format}`,
        'c_limit',
        'dpr_auto',
      ].filter(Boolean).join(',');

      return originalUrl.replace('/upload/', `/upload/${transformations}/`);
    }

    // If using ImageKit
    if (originalUrl.includes('imagekit.io')) {
      const params = [
        `q-${quality}`,
        width ? `w-${width}` : '',
        format === 'auto' ? 'f-auto' : `f-${format}`,
      ].filter(Boolean).join(',');

      return `${originalUrl}?tr=${params}`;
    }

    return originalUrl;
  }

  /**
   * Get image quality based on network
   */
  private getImageQuality(): number {
    switch (this.strategy.imageQuality) {
      case 'low':
        return 40;
      case 'medium':
        return 70;
      case 'high':
      default:
        return 90;
    }
  }

  /**
   * Should lazy load resource
   */
  shouldLazyLoad(resourceType: 'image' | 'iframe' | 'script' = 'image'): boolean {
    if (resourceType === 'script') {
      return this.isSlowConnection();
    }

    return this.strategy.enableLazyLoading;
  }

  /**
   * Get chunk size for pagination
   */
  getChunkSize(defaultSize: number = 20): number {
    switch (this.strategy.chunkSize) {
      case 'small':
        return Math.min(10, defaultSize);
      case 'medium':
        return Math.min(20, defaultSize);
      case 'large':
      default:
        return defaultSize;
    }
  }

  /**
   * Should prefetch link
   */
  shouldPrefetch(priority: 'high' | 'medium' | 'low' = 'medium'): boolean {
    if (!this.strategy.prefetchLinks) return false;

    if (priority === 'high') return true;
    if (priority === 'low') return false;

    // For medium priority, only prefetch on good connections
    return !this.isSlowConnection();
  }

  /**
   * Get cache TTL based on strategy
   */
  getCacheTTL(resourceType: 'api' | 'image' | 'static' = 'api'): number {
    const baseTTL = {
      api: 60, // 1 minute
      image: 3600, // 1 hour
      static: 86400, // 1 day
    };

    switch (this.strategy.cacheStrategy) {
      case 'aggressive':
        return baseTTL[resourceType] * 4;
      case 'minimal':
        return baseTTL[resourceType] / 2;
      case 'moderate':
      default:
        return baseTTL[resourceType];
    }
  }

  /**
   * Create intersection observer for lazy loading
   */
  createLazyLoadObserver(
    callback: (entries: IntersectionObserverEntry[]) => void
  ): IntersectionObserver | null {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }

    // Adjust root margin based on network speed
    const rootMargin = this.isSlowConnection() ? '50px' : '200px';

    return new IntersectionObserver(callback, {
      root: null,
      rootMargin,
      threshold: 0.01,
    });
  }

  /**
   * Debounce function for slow connections
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    customDelay?: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    // Increase delay for slow connections
    const delay = customDelay || (this.isSlowConnection() ? 500 : 250);

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function for slow connections
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    customLimit?: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    // Increase throttle limit for slow connections
    const limit = customLimit || (this.isSlowConnection() ? 1000 : 500);

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// Export convenience functions
export const getOptimizedImageUrl = (url: string, width?: number, format?: 'auto' | 'webp' | 'jpg') =>
  performanceOptimizer.getOptimizedImageUrl(url, width, format);
export const shouldLazyLoad = (resourceType?: 'image' | 'iframe' | 'script') =>
  performanceOptimizer.shouldLazyLoad(resourceType);
export const isSlowConnection = () => performanceOptimizer.isSlowConnection();
export const getChunkSize = (defaultSize?: number) => performanceOptimizer.getChunkSize(defaultSize);
export const shouldPrefetch = (priority?: 'high' | 'medium' | 'low') =>
  performanceOptimizer.shouldPrefetch(priority);

/**
 * React hook for performance optimization
 */
export function usePerformanceOptimization() {
  if (typeof window === 'undefined') {
    return {
      strategy: performanceOptimizer.getStrategy(),
      networkQuality: null,
      isSlowConnection: false,
      shouldLazyLoad: () => false,
      getOptimizedImageUrl: (url: string) => url,
      getChunkSize: (defaultSize: number) => defaultSize,
    };
  }

  return {
    strategy: performanceOptimizer.getStrategy(),
    networkQuality: performanceOptimizer.getNetworkQuality(),
    isSlowConnection: performanceOptimizer.isSlowConnection(),
    shouldLazyLoad: performanceOptimizer.shouldLazyLoad.bind(performanceOptimizer),
    getOptimizedImageUrl: performanceOptimizer.getOptimizedImageUrl.bind(performanceOptimizer),
    getChunkSize: performanceOptimizer.getChunkSize.bind(performanceOptimizer),
    shouldPrefetch: performanceOptimizer.shouldPrefetch.bind(performanceOptimizer),
    debounce: performanceOptimizer.debounce.bind(performanceOptimizer),
    throttle: performanceOptimizer.throttle.bind(performanceOptimizer),
  };
}