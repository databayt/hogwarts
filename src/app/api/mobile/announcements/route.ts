// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * GET /api/mobile/announcements — list announcements
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "20")
    const skip = (page - 1) * perPage

    const where = {
      schoolId: auth.schoolId,
      published: true,
    }

    const [announcements, total] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: perPage,
        select: {
          id: true,
          title: true,
          body: true,
          priority: true,
          published: true,
          publishedAt: true,
          expiresAt: true,
          creator: { select: { username: true, image: true } },
        },
      }),
      db.announcement.count({ where }),
    ])

    const data = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.body,
      priority: a.priority,
      published_at: a.publishedAt?.toISOString() || null,
      expires_at: a.expiresAt?.toISOString() || null,
      author_name: a.creator?.username || null,
      author_avatar: a.creator?.image || null,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile announcements error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
