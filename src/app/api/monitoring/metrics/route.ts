/**
 * System Metrics API - Platform Admin Dashboard
 *
 * Provides real-time system health and application statistics.
 *
 * METRICS COLLECTED:
 * 1. System: Process uptime, memory usage (heap, RSS, external)
 * 2. Database: Connection status, response time, pool stats
 * 3. Application: Total schools, users, recent activity
 * 4. Performance: Response times, requests/minute (requires integration)
 *
 * ACCESS CONTROL:
 * - DEVELOPER role only (school-dashboard admins)
 * - Returns 403 for non-developers
 * - Logged for audit trail
 *
 * WHY DEVELOPER-ONLY:
 * - Contains sensitive operational data
 * - Could expose infrastructure details
 * - Not relevant to school admins/teachers
 *
 * MEMORY THRESHOLDS:
 * - heapUsagePercent > 75%: Warning (consider scaling)
 * - heapUsagePercent > 90%: Critical (possible OOM)
 *
 * CACHE HEADERS:
 * - no-cache, no-store: Metrics must be fresh
 * - Prevents stale data in monitoring dashboards
 *
 * INTEGRATION POINTS:
 * - Uptime monitoring: Pingdom, UptimeRobot, Vercel Analytics
 * - APM: Sentry performance, Datadog, New Relic
 * - Alerting: PagerDuty webhook on threshold breach
 *
 * LIMITATIONS:
 * - Performance metrics (requests/minute) not yet implemented
 * - activeUsers24h requires additional query (commented out)
 * - errorRate24h requires Sentry API integration
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

interface SystemMetrics {
  timestamp: string
  environment: string
  system: {
    uptime: number
    memory: {
      heapUsed: number
      heapTotal: number
      external: number
      rss: number
      heapUsagePercent: number
    }
    platform: string
    nodeVersion: string
  }
  database: {
    connectionStatus: "connected" | "disconnected"
    responseTime?: number
    activeConnections?: number
  }
  application: {
    totalSchools?: number
    totalUsers?: number
    activeUsers24h?: number
    errorRate24h?: number
  }
  performance: {
    averageResponseTime?: number
    requestsPerMinute?: number
  }
}

async function getDatabaseMetrics() {
  const start = Date.now()
  try {
    // Test database connection and get basic stats
    await db.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start

    // Get application metrics
    const [schoolCount, userCount] = await Promise.all([
      db.school.count(),
      db.user.count(),
    ])

    return {
      connectionStatus: "connected" as const,
      responseTime,
      applicationStats: {
        totalSchools: schoolCount,
        totalUsers: userCount,
      },
    }
  } catch (error) {
    return {
      connectionStatus: "disconnected" as const,
      error: error instanceof Error ? error.message : "Unknown database error",
    }
  }
}

function getSystemMetrics() {
  const memory = process.memoryUsage()
  return {
    uptime: Math.round(process.uptime()),
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
      external: Math.round(memory.external / 1024 / 1024),
      rss: Math.round(memory.rss / 1024 / 1024),
      heapUsagePercent: Math.round((memory.heapUsed / memory.heapTotal) * 100),
    },
    platform: process.platform,
    nodeVersion: process.version,
  }
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || "metrics-request"

  try {
    // Check authentication - this endpoint should be protected
    const session = await auth()
    if (!session?.user || session.user.role !== "DEVELOPER") {
      logger.warn("Unauthorized access to metrics endpoint", {
        requestId,
        action: "unauthorized_metrics_access",
        userId: session?.user?.id,
        userRole: session?.user?.role,
      })

      return NextResponse.json(
        { error: "Unauthorized access. Developer role required." },
        { status: 403 }
      )
    }

    // Gather metrics
    const [databaseMetrics, systemMetrics] = await Promise.all([
      getDatabaseMetrics(),
      getSystemMetrics(),
    ])

    const metrics: SystemMetrics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "unknown",
      system: systemMetrics,
      database: {
        connectionStatus: databaseMetrics.connectionStatus,
        responseTime: databaseMetrics.responseTime,
      },
      application: {
        totalSchools: databaseMetrics.applicationStats?.totalSchools,
        totalUsers: databaseMetrics.applicationStats?.totalUsers,
      },
      performance: {
        // These would need to be collected from a monitoring service
        // For now, we'll leave them undefined
      },
    }

    logger.info("System metrics retrieved", {
      requestId,
      action: "metrics_retrieved",
      userId: session.user.id,
      systemStatus: databaseMetrics.connectionStatus,
    })

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    })
  } catch (error) {
    logger.error(
      "Failed to retrieve system metrics",
      error instanceof Error ? error : new Error("Unknown metrics error"),
      {
        requestId,
        action: "metrics_error",
      }
    )

    return NextResponse.json(
      { error: "Failed to retrieve system metrics" },
      { status: 500 }
    )
  }
}
