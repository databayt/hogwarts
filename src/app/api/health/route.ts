// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Health Check API
 *
 * Provides system health status for monitoring and load balancers.
 *
 * CHECK CATEGORIES:
 *
 * 1. DATABASE
 *    - Simple SELECT 1 query
 *    - Response time tracking
 *    - Connection pool status
 *
 * 2. MEMORY
 *    - Heap usage percentage
 *    - RSS (Resident Set Size)
 *    - Thresholds: >75% = warn, >90% = fail
 *
 * 3. DEPENDENCIES
 *    - External service connectivity
 *    - Environment variable presence
 *
 * STATUS CODES:
 * - 200: healthy (all checks pass)
 * - 200: degraded (some checks warn)
 * - 503: unhealthy (any check fails)
 *
 * WHY 200 FOR DEGRADED:
 * Load balancers should continue routing traffic to degraded instances.
 * Only unhealthy instances should be removed from rotation.
 *
 * USAGE:
 * - Vercel: Automatic health checks on /_health
 * - Kubernetes: livenessProbe and readinessProbe
 * - Uptime monitors: Pingdom, UptimeRobot
 *
 * GOTCHAS:
 * - Keep checks fast (<5s total) to avoid timeout
 * - Don't log every health check (spams logs)
 * - Memory check not available in Edge Runtime
 */

import { NextRequest, NextResponse } from "next/server"
import v8 from "node:v8"

import { dbCircuitBreaker } from "@/lib/circuit-breaker"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded"
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    database: HealthCheckResult
    memory: HealthCheckResult
    dependencies: HealthCheckResult
    circuitBreaker: HealthCheckResult
    whatsappBridge: HealthCheckResult
  }
}

interface HealthCheckResult {
  status: "pass" | "fail" | "warn"
  responseTime?: number
  details?: Record<string, unknown>
  error?: string
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    // Simple database connectivity tests
    await db.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start

    return {
      status: "pass",
      responseTime,
      details: {
        connected: true,
        responseTimeMs: responseTime,
      },
    }
  } catch (error) {
    const responseTime = Date.now() - start
    return {
      status: "fail",
      responseTime,
      error:
        error instanceof Error ? error.message : "Database connection failed",
      details: {
        connected: false,
      },
    }
  }
}

function checkMemory(): HealthCheckResult {
  if (typeof process !== "undefined" && process.memoryUsage) {
    const memory = process.memoryUsage()
    const heapUsedMB = Math.round(memory.heapUsed / 1024 / 1024)
    const heapTotalMB = Math.round(memory.heapTotal / 1024 / 1024)
    // Measure against the real ceiling (--max-old-space-size), not heapTotal:
    // V8 grows heapTotal to fit heapUsed, so that ratio hovers near 90% on a
    // perfectly healthy process and flipped this endpoint to 503 at random.
    const heapLimit = v8.getHeapStatistics().heap_size_limit
    const memoryUsagePercent = (memory.heapUsed / heapLimit) * 100

    return {
      status:
        memoryUsagePercent > 90
          ? "fail"
          : memoryUsagePercent > 75
            ? "warn"
            : "pass",
      details: {
        heapUsedMB,
        heapTotalMB,
        heapLimitMB: Math.round(heapLimit / 1024 / 1024),
        heapUsagePercent: Math.round(memoryUsagePercent),
        rss: Math.round(memory.rss / 1024 / 1024),
        external: Math.round(memory.external / 1024 / 1024),
      },
    }
  }

  return {
    status: "warn",
    details: {
      message: "Memory usage information not available",
    },
  }
}

function checkCircuitBreaker(): HealthCheckResult {
  const state = dbCircuitBreaker.getState()
  return {
    status:
      state.state === "closed"
        ? "pass"
        : state.state === "half-open"
          ? "warn"
          : "fail",
    details: {
      state: state.state,
      consecutiveFailures: state.failures,
      remainingCooldownMs: state.remainingCooldownMs,
    },
  }
}

function checkDependencies(): HealthCheckResult {
  // Only env vars the app cannot run without belong here. STRIPE_API_KEY is
  // optional — it gates SaaS subscription billing, not school operation — so a
  // school-only deployment without it is healthy, not "unhealthy".
  const requiredEnvVars = ["DATABASE_URL", "AUTH_SECRET"]

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName])

  return {
    status: missingVars.length > 0 ? "fail" : "pass",
    details: {
      requiredEnvVars: requiredEnvVars.length,
      missingEnvVars: missingVars.length,
      missing: missingVars,
      nodeVersion: process.version,
      platform: process.platform,
    },
  }
}

/**
 * The embedded WhatsApp bridge (Evolution API, supervised by cf/entry.cjs on
 * 127.0.0.1:8080). Probed only when EVOLUTION_API_URL points at loopback —
 * that is, when the bridge is expected inside this container. It never fails
 * the app: a silent bridge is "warn".
 */
async function checkWhatsAppBridge(): Promise<HealthCheckResult> {
  const url = process.env.EVOLUTION_API_URL || ""
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(url)) {
    return { status: "pass", details: { embedded: false } }
  }
  const startTime = Date.now()
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    })
    return {
      status: res.ok ? "pass" : "warn",
      responseTime: Date.now() - startTime,
      details: { embedded: true, httpStatus: res.status },
    }
  } catch (error) {
    return {
      status: "warn",
      responseTime: Date.now() - startTime,
      details: { embedded: true },
      error: error instanceof Error ? error.message : "unreachable",
    }
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const requestId = request.headers.get("x-request-id") || "health-check"

  try {
    // Perform health checks
    const [databaseCheck, memoryCheck, dependenciesCheck, whatsappBridgeCheck] =
      await Promise.all([
        checkDatabase(),
        Promise.resolve(checkMemory()),
        Promise.resolve(checkDependencies()),
        checkWhatsAppBridge(),
      ])

    // Determine overall status
    const checks = {
      database: databaseCheck,
      memory: memoryCheck,
      dependencies: dependenciesCheck,
      circuitBreaker: checkCircuitBreaker(),
      whatsappBridge: whatsappBridgeCheck,
    }

    const hasFailures = Object.values(checks).some(
      (check) => check.status === "fail"
    )
    const hasWarnings = Object.values(checks).some(
      (check) => check.status === "warn"
    )

    const overallStatus: HealthCheck["status"] = hasFailures
      ? "unhealthy"
      : hasWarnings
        ? "degraded"
        : "healthy"

    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "unknown",
      uptime: process.uptime ? Math.round(process.uptime()) : 0,
      checks,
    }

    const responseTime = Date.now() - startTime

    // Log health check results
    if (overallStatus === "healthy") {
      logger.debug("Health check completed", {
        requestId,
        action: "health_check",
        status: overallStatus,
        responseTime,
      })
    } else {
      logger.warn("Health check detected issues", {
        requestId,
        action: "health_check",
        status: overallStatus,
        responseTime,
        failures: Object.entries(checks)
          .filter(([, check]) => check.status === "fail")
          .map(([name]) => name),
        warnings: Object.entries(checks)
          .filter(([, check]) => check.status === "warn")
          .map(([name]) => name),
      })
    }

    // Return appropriate HTTP status
    const httpStatus =
      overallStatus === "healthy"
        ? 200
        : overallStatus === "degraded"
          ? 200
          : 503

    return NextResponse.json(healthCheck, {
      status: httpStatus,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    const responseTime = Date.now() - startTime

    logger.error(
      "Health check failed",
      error instanceof Error ? error : new Error("Unknown health check error"),
      {
        requestId,
        action: "health_check_error",
        responseTime,
      }
    )

    const errorHealthCheck: HealthCheck = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "unknown",
      uptime: process.uptime ? Math.round(process.uptime()) : 0,
      checks: {
        database: { status: "fail", error: "Health check failed" },
        memory: { status: "fail", error: "Health check failed" },
        dependencies: { status: "fail", error: "Health check failed" },
        circuitBreaker: checkCircuitBreaker(),
        whatsappBridge: { status: "warn", error: "Health check failed" },
      },
    }

    return NextResponse.json(errorHealthCheck, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  }
}
