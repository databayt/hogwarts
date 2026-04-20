// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * GET /api/mobile/notifications — list user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "30")
    const unreadOnly = searchParams.get("unread") === "true"
    const skip = (page - 1) * perPage

    const where = {
      schoolId: auth.schoolId,
      userId: auth.userId,
      ...(unreadOnly ? { read: false } : {}),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          type: true,
          priority: true,
          title: true,
          body: true,
          metadata: true,
          read: true,
          readAt: true,
          createdAt: true,
          actor: { select: { username: true, image: true } },
        },
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { schoolId: auth.schoolId, userId: auth.userId, read: false },
      }),
    ])

    const data = notifications.map((n) => ({
      id: n.id,
      type: n.type,
      priority: n.priority,
      title: n.title,
      body: n.body,
      metadata: n.metadata,
      is_read: n.read,
      read_at: n.readAt?.toISOString() || null,
      created_at: n.createdAt.toISOString(),
      actor_name: n.actor?.username || null,
      actor_avatar: n.actor?.image || null,
    }))

    return NextResponse.json({
      data,
      total,
      unread_count: unreadCount,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error("Mobile notifications error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
