// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import {
  buildLiveClassWhere,
  resolveViewerSectionScope,
} from "@/components/school-dashboard/live/queries"

import { ensureDemoClock } from "@/components/school-dashboard/live/demo-clock"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * Mobile Live API — what is on, and what was.
 *
 * `/api/mobile/conference/:id/join` has been able to mint a join ticket for a
 * while, but nothing could tell a phone a session EXISTS: the timetable route
 * returns slots with no live-class field, and there was no list. A ticket you
 * cannot discover is a door with no corridor. This is the corridor.
 *
 * Visibility is the web's own: `resolveViewerSectionScope` decides whether the
 * reader sees the whole school (staff), their own sections plus every
 * school-wide session (students and guardians), or nothing, and
 * `buildLiveClassWhere` turns that into the same `where` the web list uses.
 *
 * GET /api/mobile/live/sessions?window=today|upcoming|past&page=&limit=
 */
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId, role } = auth

    // The demo tenant's three clock-straddling rows go stale within the hour,
    // and the web landing repairs them at read time before it renders. Without
    // the same call here the phone shows an empty day while the browser shows
    // three live classes — the same school, two different answers. Demo only:
    // `ensureDemoClock` never invents a class for a real school.
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { domain: true },
    })
    if (school?.domain === "demo") {
      await ensureDemoClock(schoolId)
    }

    const scope = await resolveViewerSectionScope(schoolId, userId, role)
    if (scope === "none") {
      return NextResponse.json({ data: [], total: 0, page: 1, per_page: 0 })
    }

    const { searchParams } = new URL(request.url)
    const window = searchParams.get("window") ?? "today"
    const page = Math.max(1, Number(searchParams.get("page")) || 1)
    const requested = Number(searchParams.get("limit"))
    const perPage =
      Number.isFinite(requested) && requested > 0
        ? Math.min(Math.trunc(requested), MAX_LIMIT)
        : DEFAULT_LIMIT

    const where = buildLiveClassWhere(
      schoolId,
      scope === "all"
        ? {}
        : { sectionIds: scope.sectionIds, classIds: scope.classIds }
    )

    // The three windows the landing page reads as: what is on now or later
    // today, everything still to come, and what already happened.
    const now = new Date()
    if (window === "today") {
      const dayEnd = new Date(now)
      dayEnd.setHours(23, 59, 59, 999)
      where.scheduledStart = { lte: dayEnd }
      where.scheduledEnd = { gte: startOfDay(now) }
    } else if (window === "upcoming") {
      where.scheduledStart = { gt: now }
    } else if (window === "past") {
      where.scheduledEnd = { lt: now }
    }

    const [total, rows] = await Promise.all([
      db.conference.count({ where }),
      db.conference.findMany({
        where,
        // Today and upcoming read forwards; the past reads backwards, newest
        // first, which is how a student looks for the class they missed.
        orderBy: { scheduledStart: window === "past" ? "desc" : "asc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: SESSION_SELECT,
      }),
    ])

    return NextResponse.json({
      data: rows.map(toSessionDto),
      total,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error("[mobile/live/sessions] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const SESSION_SELECT = {
  id: true,
  title: true,
  status: true,
  scheduledStart: true,
  scheduledEnd: true,
  actualStart: true,
  actualEnd: true,
  provider: true,
  meetingUrl: true,
  visibility: true,
  subject: { select: { id: true, name: true, thumbnail: true, color: true } },
  section: {
    select: { id: true, name: true, grade: { select: { id: true, name: true } } },
  },
  teacher: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhotoUrl: true,
    },
  },
  // Is there anything to catch up WITH. Only `ready` counts — a row still
  // pending or processing has no object behind it, and offering it sends a
  // student who missed the class to a player that cannot play.
  recordings: {
    where: { status: "ready" as const, deletedAt: null },
    select: { id: true },
    take: 1,
  },
} as const

type SessionRow = {
  id: string
  title: string | null
  status: string
  scheduledStart: Date
  scheduledEnd: Date
  actualStart: Date | null
  actualEnd: Date | null
  provider: string
  meetingUrl: string | null
  visibility: string
  subject: { id: string; name: string; thumbnail: string | null; color: string | null } | null
  section: { id: string; name: string; grade: { id: string; name: string } | null } | null
  teacher: {
    id: string
    firstName: string
    lastName: string
    profilePhotoUrl: string | null
  } | null
  recordings: { id: string }[]
}

function toSessionDto(session: SessionRow) {
  return {
    id: session.id,
    title: session.title,
    status: session.status,
    scheduled_start: session.scheduledStart.toISOString(),
    scheduled_end: session.scheduledEnd.toISOString(),
    actual_start: session.actualStart?.toISOString() ?? null,
    actual_end: session.actualEnd?.toISOString() ?? null,
    provider: session.provider,
    // Only an `external` session has a link worth handing out; a LiveKit room
    // is reached with a ticket from `/api/mobile/conference/:id/join`, never
    // with a URL.
    meeting_url: session.provider === "external" ? session.meetingUrl : null,
    visibility: session.visibility,
    subject: session.subject && {
      id: session.subject.id,
      name: session.subject.name,
      thumbnail: session.subject.thumbnail,
      color: session.subject.color,
    },
    section: session.section && {
      id: session.section.id,
      name: session.section.name,
      grade: session.section.grade?.name ?? null,
    },
    teacher: session.teacher && {
      id: session.teacher.id,
      name: [session.teacher.firstName, session.teacher.lastName]
        .filter(Boolean)
        .join(" "),
      photo_url: session.teacher.profilePhotoUrl,
    },
    has_recording: session.recordings.length > 0,
  }
}
