/**
 * Backup Management API - Platform Administration
 *
 * Provides database backup operations for disaster recovery.
 *
 * SUPPORTED ACTIONS:
 * - create: Generate new backup snapshot
 * - restore: Restore database from backup ID
 * - verify: Validate backup integrity
 * - cleanup: Remove old backups per retention policy
 *
 * ACCESS CONTROL:
 * - PLATFORM_ADMIN only (not school admins)
 * - WHY: Backup operations affect entire school-dashboard, not single tenant
 * - Destructive operations require highest privilege level
 *
 * WHY PLATFORM_ADMIN vs ADMIN:
 * - School ADMIN can only manage their tenant
 * - Backups contain ALL schools' data (cross-tenant)
 * - Restore could overwrite other schools' data
 * - Only school-dashboard operators should have this access
 *
 * WHY POST FOR ACTIONS (not GET):
 * - All backup operations have side effects (create files, modify DB)
 * - GET would be inappropriate (caching, browser prefetch)
 * - Action type in body allows single endpoint for multiple ops
 *
 * WHY SINGLE ENDPOINT WITH action PARAM:
 * - Reduces route proliferation (/backup/create, /backup/restore, etc.)
 * - All operations share same auth logic
 * - Easier to add new actions without new routes
 *
 * GOTCHAS:
 * - Restore is destructive and cannot be undone
 * - Cleanup respects retention policy (default: 30 days)
 * - Large databases may timeout on Vercel (10s limit)
 * - Consider background job for production backups
 *
 * @see /lib/backup-service.ts for implementation details
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { backupService } from "@/lib/backup-service"
import { logger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (session?.user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Platform admin access required" },
        { status: 401 }
      )
    }

    const { action, backupId } = await request.json()

    switch (action) {
      case "create":
        const backup = await backupService.createBackup("manual")
        return NextResponse.json({ success: true, backup })

      case "restore":
        if (!backupId) {
          return NextResponse.json(
            { error: "Backup ID is required for restore" },
            { status: 400 }
          )
        }
        await backupService.restoreFromBackup(backupId)
        return NextResponse.json({ success: true })

      case "verify":
        if (!backupId) {
          return NextResponse.json(
            { error: "Backup ID is required for verification" },
            { status: 400 }
          )
        }
        const isValid = await backupService.verifyBackup(backupId)
        return NextResponse.json({ success: true, isValid })

      case "cleanup":
        const deletedCount = await backupService.cleanupOldBackups()
        return NextResponse.json({ success: true, deletedCount })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    logger.error(
      "Backup API error",
      error instanceof Error ? error : new Error("Unknown error")
    )
    return NextResponse.json(
      { error: "Backup operation failed" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (session?.user?.role !== "PLATFORM_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Platform admin access required" },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get("limit") || "10")

    const history = await backupService.getBackupHistory(limit)
    return NextResponse.json({ history })
  } catch (error) {
    logger.error(
      "Backup history API error",
      error instanceof Error ? error : new Error("Unknown error")
    )
    return NextResponse.json(
      { error: "Failed to retrieve backup history" },
      { status: 500 }
    )
  }
}
