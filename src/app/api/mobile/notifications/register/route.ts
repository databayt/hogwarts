// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * POST /api/mobile/notifications/register — register FCM device token
 *
 * Stores the device token as a NotificationSubscription with entityType "fcm_device".
 * Upserts so re-registering the same token is idempotent.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const body = await request.json()
    const deviceToken = body.device_token
    const platform = body.platform // "ios" | "android"

    if (!deviceToken || typeof deviceToken !== "string") {
      return NextResponse.json(
        { error: "device_token is required" },
        { status: 400 }
      )
    }

    // Use NotificationSubscription to store FCM tokens
    // entityType = "fcm_device", entityId = device token
    await db.notificationSubscription.upsert({
      where: {
        userId_entityType_entityId: {
          userId: auth.userId,
          entityType: "fcm_device",
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
        entityType: "fcm_device",
        entityId: deviceToken,
        active: true,
      },
    })

    // Deactivate old tokens for this user on the same platform
    // (a user should only have one active token per platform)
    if (platform === "ios" || platform === "android") {
      await db.notificationSubscription.updateMany({
        where: {
          userId: auth.userId,
          schoolId: auth.schoolId,
          entityType: "fcm_device",
          entityId: { not: deviceToken },
          active: true,
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
