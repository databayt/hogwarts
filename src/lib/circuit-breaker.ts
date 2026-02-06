/**
 * Circuit Breaker - Fail-Fast for Database Outages
 *
 * Prevents cascading failures when Neon PostgreSQL is unavailable.
 * Without this, every serverless function hangs for ~5s (connection timeout),
 * degrading the entire platform.
 *
 * STATE MACHINE:
 *   CLOSED  → normal operation, requests pass through
 *   OPEN    → database down, fail immediately (no connection attempt)
 *   HALF_OPEN → cooldown expired, allow ONE probe request through
 *
 * TRANSITIONS:
 *   CLOSED → OPEN:      after `failureThreshold` consecutive failures
 *   OPEN → HALF_OPEN:   after `cooldownMs` elapses
 *   HALF_OPEN → CLOSED: probe request succeeds
 *   HALF_OPEN → OPEN:   probe request fails (reset cooldown timer)
 *
 * USAGE:
 * ```typescript
 * import { dbCircuitBreaker } from "@/lib/circuit-breaker"
 *
 * const result = await dbCircuitBreaker.execute(() => db.user.findMany())
 * ```
 */

type CircuitState = "closed" | "open" | "half-open"

interface CircuitBreakerConfig {
  failureThreshold: number // Consecutive failures before opening
  cooldownMs: number // Time before trying again (half-open)
  name: string // For logging
}

class CircuitBreaker {
  private failures = 0
  private lastFailureTime = 0
  private state: CircuitState = "closed"
  private readonly config: CircuitBreakerConfig

  constructor(config: CircuitBreakerConfig) {
    this.config = config
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // OPEN: fail fast without attempting the operation
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime >= this.config.cooldownMs) {
        // Cooldown expired → transition to half-open, allow one probe
        this.state = "half-open"
      } else {
        throw new CircuitBreakerError(
          `[${this.config.name}] Circuit breaker is open — database unavailable`,
          this.remainingCooldownMs()
        )
      }
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private onSuccess(): void {
    // Reset on any success
    this.failures = 0
    this.state = "closed"
  }

  private onFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.state === "half-open") {
      // Probe failed → back to open
      this.state = "open"
      return
    }

    if (this.failures >= this.config.failureThreshold) {
      this.state = "open"
      console.error(
        `[${this.config.name}] Circuit breaker OPEN after ${this.failures} consecutive failures`
      )
    }
  }

  private remainingCooldownMs(): number {
    return Math.max(
      0,
      this.config.cooldownMs - (Date.now() - this.lastFailureTime)
    )
  }

  /** Current circuit state for health checks */
  getState(): {
    state: CircuitState
    failures: number
    remainingCooldownMs: number
  } {
    return {
      state: this.state,
      failures: this.failures,
      remainingCooldownMs:
        this.state === "open" ? this.remainingCooldownMs() : 0,
    }
  }

  /** Manually reset the circuit (e.g., after a fix is deployed) */
  reset(): void {
    this.failures = 0
    this.lastFailureTime = 0
    this.state = "closed"
  }
}

export class CircuitBreakerError extends Error {
  readonly retryAfterMs: number

  constructor(message: string, retryAfterMs: number) {
    super(message)
    this.name = "CircuitBreakerError"
    this.retryAfterMs = retryAfterMs
  }
}

// Singleton for database operations
// Opens after 5 consecutive failures, tries again after 30 seconds
export const dbCircuitBreaker = new CircuitBreaker({
  name: "database",
  failureThreshold: 5,
  cooldownMs: 30_000,
})
