// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Cleanup Expired Notifications
 *
 * Removes stale notifications to keep the database lean.
 *
 * TRIGGER: Daily at 2:00 AM (0 2 * * *)
 *
 * CLEANUP RULES:
 * 1. Delete read notifications past their expiresAt date
 * 2. Delete all notifications older than 90 days (hard retention limit)
 *
 * WHY TWO PASSES:
 * - Read + expired: User saw it and it's past shelf life
 * - 90-day hard limit: Even unread notifications get cleaned up eventually
 *   to prevent unbounded table growth
 */

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const startTime = Date.now()
    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    // Delete read notifications past their expiresAt
    const expiredRead = await db.notification.deleteMany({
      where: {
        read: true,
        expiresAt: {
          lte: now,
        },
      },
    })

    // Delete all notifications older than 90 days
    const oldNotifications = await db.notification.deleteMany({
      where: {
        createdAt: {
          lte: ninetyDaysAgo,
        },
      },
    })

    return NextResponse.json({
      success: true,
      expiredReadDeleted: expiredRead.count,
      oldDeleted: oldNotifications.count,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[cleanup-notifications] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
