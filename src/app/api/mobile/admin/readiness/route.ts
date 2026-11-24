// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfInstant,
} from "@/components/school-dashboard/live/day-window"
import { loadClassReadiness } from "@/components/school-dashboard/school/readiness/queries"
import type { MemberReadinessRow } from "@/components/school-dashboard/school/readiness/queries"

import { authenticate, isAuthError } from "../../lib/authenticate"
import { hasRole } from "../../lib/roles"

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function person(r: MemberReadinessRow) {
  return {
    name: r.name,
    level: r.readiness.level,
    reasons: r.readiness.reasons,
  }
}

/**
 * GET /api/mobile/admin/readiness?date=YYYY-MM-DD — class readiness.
 *
 * ADMIN / DEVELOPER see every class; a TEACHER sees only the sections they
 * are the homeroom teacher of (403 when they have none). Reasons are codes —
 * the app maps them to words.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const isAdmin = hasRole(auth, "ADMIN", "DEVELOPER")
    const isTeacher = hasRole(auth, "TEACHER")
    if (!isAdmin && !isTeacher) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    let allowed: Set<string> | null = null
    if (!isAdmin) {
      const mine = await db.section.findMany({
        where: {
          schoolId: auth.schoolId,
          homeroomTeacher: { userId: auth.userId },
        },
        select: { id: true },
      })
      if (mine.length === 0) {
        return NextResponse.json(
          { error: "Not a class supervisor" },
          { status: 403 }
        )
      }
      allowed = new Set(mine.map((s) => s.id))
    }

    let date = request.nextUrl.searchParams.get("date")
    if (date !== null && !DATE_RE.test(date)) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }
    if (!date) {
      const school = await db.school.findUnique({
        where: { id: auth.schoolId },
        select: { timezone: true },
      })
      date = schoolDayOfInstant(
        school?.timezone || DEFAULT_SCHOOL_TZ,
        new Date()
      )
    }

    const all = await loadClassReadiness(auth.schoolId, date)
    const rows = allowed ? all.filter((c) => allowed.has(c.sectionId)) : all

    return NextResponse.json({
      date,
      classes: rows.map((c) => ({
        sectionId: c.sectionId,
        name: c.sectionName,
        supervisor: c.supervisor
          ? { ...person(c.supervisor), canCover: c.supervisor.canCover }
          : null,
        sessions: c.classes.map((s) => ({
          start: s.start,
          subject: s.subject,
          teacher: s.teacher ? person(s.teacher) : null,
        })),
        students: c.students.map((st) => ({
          ...person(st),
          username: st.username,
        })),
      })),
    })
  } catch (error) {
    console.error("Mobile admin readiness error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
