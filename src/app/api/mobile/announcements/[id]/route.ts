// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/announcements/:id — announcement detail
 *
 * Also marks the announcement as read for the current user.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const announcement = await db.announcement.findFirst({
      where: { id, schoolId: auth.schoolId },
      select: {
        id: true,
        title: true,
        body: true,
        scope: true,
        priority: true,
        published: true,
        publishedAt: true,
        expiresAt: true,
        pinned: true,
        featured: true,
        classId: true,
        role: true,
        createdAt: true,
        creator: { select: { username: true, image: true } },
        class: { select: { id: true, name: true } },
        _count: { select: { readReceipts: true } },
      },
    })

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      )
    }

    // Mark as read (upsert to avoid duplicates)
    await db.announcementRead
      .upsert({
        where: {
          announcementId_userId: {
            announcementId: id,
            userId: auth.userId,
          },
        },
        update: {
          readAt: new Date(),
        },
        create: {
          schoolId: auth.schoolId,
          announcementId: id,
          userId: auth.userId,
        },
      })
      .catch(() => {
        // Non-critical — don't fail the request if read-tracking fails
      })

    return NextResponse.json({
      id: announcement.id,
      title: announcement.title,
      content: announcement.body,
      scope: announcement.scope,
      priority: announcement.priority,
      is_published: announcement.published,
      published_at: announcement.publishedAt?.toISOString() || null,
      expires_at: announcement.expiresAt?.toISOString() || null,
      is_pinned: announcement.pinned,
      is_featured: announcement.featured,
      target_class: announcement.class
        ? { id: announcement.class.id, name: announcement.class.name }
        : null,
      target_role: announcement.role,
      read_count: announcement._count.readReceipts,
      created_at: announcement.createdAt.toISOString(),
      author_name: announcement.creator?.username || null,
      author_avatar: announcement.creator?.image || null,
    })
  } catch (error) {
    console.error("Mobile announcement detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
