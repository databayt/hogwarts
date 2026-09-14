// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import {
  announcementListSelect,
  getAnnouncementsList,
  resolveViewerAudience,
} from "@/components/school-dashboard/listings/announcements/queries"
import { localize } from "@/components/translation/localize"

import { authenticate, isAuthError } from "../lib/authenticate"
import { displayLang, viewerRole } from "./viewer"

const MAX_PER_PAGE = 100

/**
 * GET /api/mobile/announcements — the list the web's /announcements shows
 * this caller.
 *
 * Staff (DEVELOPER, ADMIN, TEACHER, STAFF, ACCOUNTANT) see the whole school
 * list, drafts included, exactly as the web table does. A student, guardian
 * or plain user sees only published, unexpired notices addressed to them —
 * school-wide, their role, or one of their classes — via the same
 * `resolveViewerAudience` the web page and its load-more action use.
 *
 * Query: `page`, `per_page`, `title` (search), `lang` (ar|en: localize).
 * Order: pinned first, then newest (the web's default).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1") || 1)
    const perPage = Math.min(
      MAX_PER_PAGE,
      Math.max(1, parseInt(searchParams.get("per_page") || "20") || 20)
    )
    const title = searchParams.get("title")?.trim() || undefined
    const lang = displayLang(searchParams)

    const audience = await resolveViewerAudience(
      auth.schoolId,
      auth.userId,
      viewerRole(auth)
    )

    const { rows, count } = await getAnnouncementsList(
      auth.schoolId,
      { title, page, perPage },
      audience,
      {
        ...announcementListSelect,
        body: true,
        role: true,
        classId: true,
        creator: { select: { username: true, image: true } },
      }
    )

    const ids = rows.map((a) => a.id)
    const [reads, localized] = await Promise.all([
      ids.length
        ? db.announcementRead.findMany({
            where: { userId: auth.userId, announcementId: { in: ids } },
            select: { announcementId: true },
          })
        : Promise.resolve([]),
      lang
        ? localize("Announcement", rows, { schoolId: auth.schoolId, lang })
        : Promise.resolve(rows),
    ])
    const readIds = new Set(reads.map((r) => r.announcementId))

    const data = localized.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.body,
      priority: a.priority,
      published_at: a.publishedAt?.toISOString() || null,
      expires_at: a.expiresAt?.toISOString() || null,
      author_name: a.creator?.username || null,
      author_avatar: a.creator?.image || null,
      // Additive (2026-09): what the web card and reading page draw.
      scope: a.scope,
      target_role: a.role,
      class_id: a.classId,
      is_published: a.published,
      is_pinned: a.pinned,
      is_featured: a.featured,
      lang: a.lang,
      created_at: a.createdAt.toISOString(),
      is_read: readIds.has(a.id),
    }))

    return NextResponse.json({ data, total: count, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile announcements error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
