// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import { FCM_DEVICE, fcmEntityType } from "@/lib/notifications/fcm-device"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * POST /api/mobile/notifications/register — register FCM device token
 *
 * Stores the device token as a NotificationSubscription whose entityType
 * names the platform: `fcm_device:android`, `fcm_device:ios`, or plain
 * `fcm_device` when the client did not say. Upserts so re-registering the
 * same token is idempotent.
 *
 * A user keeps one active token PER PLATFORM — registering a new Android
 * token retires the old Android token, never the user's iPhone.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const deviceToken = body.device_token
    const platform: unknown = body.platform // "ios" | "android"

    if (!deviceToken || typeof deviceToken !== "string") {
      return NextResponse.json(
        { error: "device_token is required" },
        { status: 400 }
      )
    }

    const entityType = fcmEntityType(platform)

    await db.notificationSubscription.upsert({
      where: {
        userId_entityType_entityId: {
          userId: auth.userId,
          entityType,
          entityId: deviceToken,
        },
      },
      update: {
        active: true,
        updatedAt: new Date(),
      },
      create: {
        schoolId: auth.schoolId,
        userId: auth.userId,
        entityType,
        entityId: deviceToken,
        active: true,
      },
    })

    if (entityType !== FCM_DEVICE) {
      // Retire older tokens on the same platform, plus the untagged legacy row
      // for THIS token (registered before platforms were tagged) so one device
      // never holds two live rows.
      await db.notificationSubscription.updateMany({
        where: {
          userId: auth.userId,
          schoolId: auth.schoolId,
          active: true,
          OR: [
            { entityType, entityId: { not: deviceToken } },
            { entityType: FCM_DEVICE, entityId: deviceToken },
          ],
        },
        data: { active: false },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile register FCM token error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
