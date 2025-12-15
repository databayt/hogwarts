/**
 * Security Scan API - Platform Vulnerability Assessment
 *
 * Runs automated security checks and returns a vulnerability report.
 *
 * ACCESS CONTROL:
 * - PLATFORM_ADMIN only (not school admins)
 * - WHY: Security scans reveal infrastructure details
 * - Unauthorized access could expose vulnerabilities
 *
 * SCAN CATEGORIES:
 * - Headers: CSP, HSTS, X-Frame-Options
 * - Auth: JWT validation, session security
 * - Database: Injection patterns, exposed data
 * - Environment: Exposed secrets, debug mode
 *
 * SEVERITY LEVELS:
 * - Critical: Immediate exploitation risk
 * - High: Significant security gap
 * - Medium: Best practice violation
 * - Low: Minor improvement opportunity
 *
 * RESPONSE FORMAT:
 * - results: Array of test results with pass/fail
 * - recommendations: Actionable fixes for failures
 * - criticalIssues: Count of critical findings
 *
 * LOGGING BEHAVIOR:
 * - Unauthorized attempts: warn (audit trail)
 * - Critical issues: error (alert on-call)
 * - Successful scan: info
 *
 * USE CASES:
 * - Pre-deployment security check
 * - Periodic automated audits
 * - Compliance reporting (SOC2, etc.)
 *
 * GOTCHAS:
 * - Scan may take several seconds (async checks)
 * - Some checks require external network access
 * - Rate limit this endpoint to prevent DoS
 *
 * @see /lib/security-scanner.ts for test implementations
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { logger } from "@/lib/logger"
import { runSecurityScan } from "@/lib/security-scanner"

export async function GET(_request: NextRequest) {
  try {
    const session = await auth()

    // Only platform admins can run security scans
    if (session?.user?.role !== "PLATFORM_ADMIN") {
      logger.warn("Unauthorized security scan attempt", {
        userId: session?.user?.id,
        action: "security_scan_unauthorized",
      })

      return NextResponse.json(
        { error: "Unauthorized - Platform admin access required" },
        { status: 401 }
      )
    }

    logger.info("Running security scan", {
      userId: session?.user?.id,
      action: "security_scan_initiated",
    })

    // Run the security scan
    const report = await runSecurityScan()

    // Log critical issues
    if (report.criticalIssues > 0) {
      logger.error(
        "Critical security issues detected",
        new Error("Security scan found critical issues"),
        {
          action: "critical_security_issues",
          criticalCount: report.criticalIssues,
          failedTests: report.results
            .filter((r) => !r.passed && r.severity === "critical")
            .map((r) => r.test),
        }
      )
    }

    return NextResponse.json({
      success: true,
      report,
      recommendations: report.results
        .filter((r) => !r.passed && r.recommendation)
        .map((r) => r.recommendation),
    })
  } catch (error) {
    logger.error(
      "Security scan failed",
      error instanceof Error ? error : new Error("Unknown error")
    )

    return NextResponse.json({ error: "Security scan failed" }, { status: 500 })
  }
}
