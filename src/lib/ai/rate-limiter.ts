// AI API Rate Limiter and Queue Management

interface QueueItem<T = any> {
  id: string
  execute: () => Promise<T>
  resolve: (value: T) => void
  reject: (reason: any) => void
  priority: number
  retryCount: number
}

interface RateLimiterConfig {
  maxConcurrent: number // Maximum concurrent requests
  minDelay: number // Minimum delay between requests (ms)
  maxRetries: number // Maximum retry attempts
  backoffMultiplier: number // Exponential backoff multiplier
}

class AIRateLimiter {
  private queue: QueueItem[] = []
  private activeRequests = 0
  private lastRequestTime = 0
  private config: RateLimiterConfig

  // Cost tracking
  private totalCost = 0
  private requestCount = 0

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = {
      maxConcurrent: config.maxConcurrent ?? 5, // 5 concurrent requests
      minDelay: config.minDelay ?? 1000, // 1 second between batches
      maxRetries: config.maxRetries ?? 3,
      backoffMultiplier: config.backoffMultiplier ?? 2,
    }
  }

  /**
   * Add a request to the queue
   */
  async enqueue<T>(
    execute: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const item: QueueItem<T> = {
        id: Math.random().toString(36).substring(7),
        execute,
        resolve,
        reject,
        priority,
        retryCount: 0,
      }

      // Insert into queue based on priority (higher priority first)
      const insertIndex = this.queue.findIndex((q) => q.priority < priority)
      if (insertIndex === -1) {
        this.queue.push(item)
      } else {
        this.queue.splice(insertIndex, 0, item)
      }

      this.processQueue()
    })
  }

  /**
   * Process the queue
   */
  private async processQueue() {
    if (this.activeRequests >= this.config.maxConcurrent) {
      return // Max concurrent limit reached
    }

    const item = this.queue.shift()
    if (!item) {
      return // Queue is empty
    }

    // Enforce minimum delay between requests
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.config.minDelay) {
      const delay = this.config.minDelay - timeSinceLastRequest
      await this.sleep(delay)
    }

    this.activeRequests++
    this.lastRequestTime = Date.now()

    try {
      const result = await item.execute()
      item.resolve(result)
      this.requestCount++
    } catch (error: any) {
      // Handle rate limiting with exponential backoff
      if (
        error?.status === 429 &&
        item.retryCount < this.config.maxRetries
      ) {
        const backoffDelay =
          this.config.minDelay *
          Math.pow(this.config.backoffMultiplier, item.retryCount)

        console.warn(
          `Rate limited. Retrying after ${backoffDelay}ms (attempt ${item.retryCount + 1}/${this.config.maxRetries})`
        )

        await this.sleep(backoffDelay)

        item.retryCount++
        this.queue.unshift(item) // Re-add to front of queue
      } else {
        item.reject(error)
      }
    } finally {
      this.activeRequests--
      this.processQueue() // Process next item
    }
  }

  /**
   * Batch multiple similar requests together
   */
  async batch<T>(
    items: Array<{ data: any; execute: (data: any) => Promise<T> }>,
    priority: number = 0
  ): Promise<T[]> {
    const promises = items.map((item) =>
      this.enqueue(() => item.execute(item.data), priority)
    )

    return Promise.all(promises)
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      totalRequests: this.requestCount,
      totalCost: this.totalCost,
      averageCostPerRequest: this.requestCount > 0 ? this.totalCost / this.requestCount : 0,
    }
  }

  /**
   * Track API cost
   */
  trackCost(cost: number) {
    this.totalCost += cost
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.totalCost = 0
    this.requestCount = 0
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue.forEach((item) => {
      item.reject(new Error("Queue cleared"))
    })
    this.queue = []
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Singleton instance
export const aiRateLimiter = new AIRateLimiter({
  maxConcurrent: 5, // 5 concurrent OpenAI requests
  minDelay: 1000, // 1 second between batches
  maxRetries: 3,
  backoffMultiplier: 2,
})

// Export for custom instances
export { AIRateLimiter }
export type { RateLimiterConfig, QueueItem }
