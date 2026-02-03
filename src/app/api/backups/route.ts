/**
 * Backup Management API - Read/Write Operations
 *
 * Full backup lifecycle management for school-dashboard administrators.
 *
 * ACCESS CONTROL:
 * - DEVELOPER role only
 * - WHY: Backups contain all schools' data (cross-tenant)
 * - Restore is destructive operation
 *
 * GET ACTIONS:
 * - history: List recent backups with metadata
 * - verify: Check backup integrity before restore
 *
 * POST ACTIONS:
 * - create: Generate new backup (manual trigger)
 * - restore: Restore database from backup ID
 *
 * WHY SEPARATE FROM /api/backup:
 * - /backup: Single-action operations (PLATFORM_ADMIN)
 * - /backups: Full CRUD operations (DEVELOPER only)
 * - Different role requirements
 *
 * WHY DEVELOPER vs PLATFORM_ADMIN:
 * - DEVELOPER is school-dashboard saas-dashboard (engineering team)
 * - PLATFORM_ADMIN may be support staff
 * - Restore should be engineering-only
 *
 * BACKUP METADATA:
 * - id: Unique backup identifier
 * - type: 'manual' | 'scheduled'
 * - createdAt: Timestamp
 * - size: Backup size in bytes
 * - tables: List of backed up tables
 *
 * GOTCHAS:
 * - Restore is destructive (overwrites current data)
 * - Verify before restore recommended
 * - Large backups may timeout on Vercel
 *
 * @see /lib/backup-service.ts for implementation
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import {
  createBackup,
  getBackupHistory,
  restoreFromBackup,
  verifyBackup,
} from "@/lib/backup-service"
import { logger } from "@/lib/logger"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    // Only DEVELOPER role can access backup management
    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Unauthorized. Developer role required." },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const backupId = searchParams.get("backupId")

    switch (action) {
      case "history":
        const limit = parseInt(searchParams.get("limit") || "10")
        const history = await getBackupHistory(limit)
        return NextResponse.json({ history })

      case "verify":
        if (!backupId) {
          return NextResponse.json(
            { error: "backupId parameter required" },
            { status: 400 }
          )
        }
        const isValid = await verifyBackup(backupId)
        return NextResponse.json({ backupId, isValid })

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: history, verify" },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error(
      "Backup API error",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "backup_api_error",
      }
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Only DEVELOPER role can create backups
    if (!session?.user || session.user.role !== "DEVELOPER") {
      return NextResponse.json(
        { error: "Unauthorized. Developer role required." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, backupId } = body

    switch (action) {
      case "create":
        const metadata = await createBackup("manual")
        return NextResponse.json({
          success: true,
          backup: metadata,
        })

      case "restore":
        if (!backupId) {
          return NextResponse.json(
            { error: "backupId required for restore" },
            { status: 400 }
          )
        }
        await restoreFromBackup(backupId)
        return NextResponse.json({
          success: true,
          message: `Restored from backup ${backupId}`,
        })

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: create, restore" },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error(
      "Backup API error",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "backup_api_error",
      }
    )
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
