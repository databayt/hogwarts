// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Cron Job: Event Reminders
 *
 * Sends notification reminders for events happening in the next 24 hours.
 *
 * TRIGGER: Daily at 8:00 AM (0 8 * * *)
 *
 * EXECUTION FLOW:
 * 1. Verify CRON_SECRET authorization
 * 2. Find all PLANNED events with eventDate in the next 24 hours
 * 3. Dispatch notifications to target audience per event
 * 4. Return execution report
 *
 * TARGETING:
 * - Public events: Notify entire school
 * - Private events with targetAudience: Notify by role
 */

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { dispatchNotificationsToAudience } from "@/lib/dispatch-notification"

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
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    // Find events happening in the next 24 hours
    const upcomingEvents = await db.event.findMany({
      where: {
        status: "PLANNED",
        eventDate: {
          gte: now,
          lte: tomorrow,
        },
      },
      select: {
        id: true,
        schoolId: true,
        title: true,
        eventDate: true,
        startTime: true,
        location: true,
        isPublic: true,
        targetAudience: true,
      },
    })

    let totalCreated = 0

    for (const event of upcomingEvents) {
      const { created } = await dispatchNotificationsToAudience({
        schoolId: event.schoolId,
        type: "event_reminder",
        title: `Reminder: ${event.title}`,
        body: `Event tomorrow at ${event.startTime}${event.location ? ` - ${event.location}` : ""}`,
        priority: "normal",
        channels: ["in_app", "email"],
        metadata: {
          eventId: event.id,
          url: `/events/${event.id}`,
        },
        targetScope: event.isPublic ? "school" : "role",
        targetRole: event.targetAudience || undefined,
      })
      totalCreated += created
    }

    return NextResponse.json({
      success: true,
      events: upcomingEvents.length,
      notificationsCreated: totalCreated,
      duration: Date.now() - startTime,
    })
  } catch (error) {
    console.error("[event-reminders] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
