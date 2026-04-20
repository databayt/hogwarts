// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/notifications/preferences — get notification preferences
 * PUT /api/mobile/notifications/preferences — update notification preferences
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const preferences = await db.notificationPreference.findMany({
      where: {
        userId: auth.userId,
        schoolId: auth.schoolId,
      },
      select: {
        id: true,
        type: true,
        channel: true,
        enabled: true,
        quietHoursStart: true,
        quietHoursEnd: true,
        digestEnabled: true,
        digestFrequency: true,
      },
    })

    if (preferences.length === 0) {
      // Return sensible defaults when no preferences are stored
      return NextResponse.json({
        data: [],
        defaults: {
          in_app: true,
          email: true,
          push: true,
          sms: false,
          quiet_hours_start: 22,
          quiet_hours_end: 7,
        },
      })
    }

    const data = preferences.map((p) => ({
      id: p.id,
      type: p.type,
      channel: p.channel,
      enabled: p.enabled,
      quiet_hours_start: p.quietHoursStart,
      quiet_hours_end: p.quietHoursEnd,
      digest_enabled: p.digestEnabled,
      digest_frequency: p.digestFrequency,
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Mobile notification preferences GET error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const body = await request.json()

    // Body is an array of preference updates:
    // [{ type: "message", channel: "push", enabled: false }, ...]
    if (!Array.isArray(body.preferences)) {
      return NextResponse.json(
        { error: "preferences array is required" },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      body.preferences.map(
        (pref: { type: string; channel: string; enabled: boolean }) =>
          db.notificationPreference.upsert({
            where: {
              userId_type_channel: {
                userId: auth.userId,
                type: pref.type as never,
                channel: pref.channel as never,
              },
            },
            update: {
              enabled: pref.enabled,
            },
            create: {
              schoolId: auth.schoolId,
              userId: auth.userId,
              type: pref.type as never,
              channel: pref.channel as never,
              enabled: pref.enabled,
            },
          })
      )
    )

    return NextResponse.json({
      success: true,
      updated_count: results.length,
    })
  } catch (error) {
    console.error("Mobile notification preferences PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
