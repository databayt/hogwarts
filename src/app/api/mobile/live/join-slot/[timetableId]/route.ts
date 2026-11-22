// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"

import { getDictionary } from "@/components/internationalization/dictionaries"
import { resolveSlotJoin } from "@/components/school-dashboard/live/actions/join-slot"
import { DEFAULT_SCHOOL_TZ } from "@/components/school-dashboard/live/day-window"
import { loadNextClassToday } from "@/components/school-dashboard/live/next-class"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * `/live/join/{timetableId}` as data — the web join page's own resolver
 * (`resolveSlotJoin`) with the token's actor, so a timetable tap in the app
 * opens the room, waits, or says why not, without a web page in between.
 *
 * GET /api/mobile/live/join-slot/:timetableId?lang=ar|en
 *
 * `message` is the sentence the web page prints for the outcome (same
 * dictionary keys, `liveClasses.joinLink`); `next` is the reader's next class
 * today, for the outcomes that are a dead end (`over`, `cancelled`,
 * `unavailable`).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ timetableId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { timetableId } = await params
    const lang =
      new URL(request.url).searchParams.get("lang") === "en" ? "en" : "ar"

    const outcome = await resolveSlotJoin({
      schoolId: auth.schoolId,
      userId: auth.userId,
      role: auth.role as UserRole,
      timetableId,
    })

    if (outcome.kind === "forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (outcome.kind === "not_found") {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const [dictionary, school] = await Promise.all([
      getDictionary(lang),
      db.school.findUnique({
        where: { id: auth.schoolId },
        select: { timezone: true },
      }),
    ])
    const t = dictionary?.liveClasses?.joinLink
    const time = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: school?.timezone || DEFAULT_SCHOOL_TZ,
    })

    // The same sentences, from the same keys, as the web page.
    let message: string | null = null
    switch (outcome.kind) {
      case "early":
        message = (t?.early ?? "Your class starts at {start}.").replace(
          "{start}",
          time.format(outcome.startsAt)
        )
        break
      case "over":
        message = t?.over ?? "Today's class has ended."
        break
      case "cancelled":
        message = t?.cancelled ?? "Today's class was cancelled."
        break
      case "not_today":
        message = t?.notToday ?? "This class isn't on today's timetable."
        break
      case "not_online":
        message = t?.notOnline ?? "This class is taught in person today."
        break
      case "unavailable":
        message =
          outcome.reason === "holiday"
            ? (t?.unavailableHoliday ?? "The school is closed today.")
            : outcome.reason === "no_teacher"
              ? (t?.unavailableNoTeacher ??
                "No teacher is assigned to this class yet — ask the school office.")
              : (t?.unavailable ?? "This class has no online room yet.")
        break
    }

    const wantsNext =
      outcome.kind === "over" ||
      outcome.kind === "cancelled" ||
      outcome.kind === "unavailable"
    const nextClass = wantsNext
      ? await loadNextClassToday({
          schoolId: auth.schoolId,
          userId: auth.userId,
          role: auth.role,
          afterTimetableId: timetableId,
        }).catch(() => null)
      : null

    return NextResponse.json({
      kind: outcome.kind,
      session_id: outcome.kind === "room" ? outcome.sessionId : undefined,
      url: outcome.kind === "external" ? outcome.url : undefined,
      opens_at:
        outcome.kind === "early" ? outcome.opensAt.toISOString() : undefined,
      starts_at:
        outcome.kind === "early"
          ? outcome.startsAt.toISOString()
          : outcome.kind === "not_today" && outcome.startsAt
            ? outcome.startsAt.toISOString()
            : undefined,
      opens_in_ms: outcome.kind === "early" ? outcome.opensInMs : undefined,
      reason: outcome.kind === "unavailable" ? outcome.reason : undefined,
      message: message ?? undefined,
      ...(wantsNext
        ? {
            next: nextClass
              ? {
                  timetable_id: nextClass.timetableId,
                  title: [nextClass.subject, nextClass.section]
                    .filter(Boolean)
                    .join(" · "),
                  starts_at: nextClass.startsAt.toISOString(),
                  ends_at: nextClass.endsAt.toISOString(),
                }
              : null,
          }
        : {}),
    })
  } catch (error) {
    console.error("[mobile/live/join-slot/:timetableId] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
