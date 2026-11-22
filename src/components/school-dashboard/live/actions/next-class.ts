"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "Your next class", asked for at the moment a class ends.
//
// The room asks when its end screen appears, not when the room page loads: at
// load the answer would be fifty minutes old by the time it is shown, and it
// would cost every entry into a room a string of reads for a card most
// entries never reach.
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { loadNextClassToday } from "../next-class"
import type { NextClassData } from "../next-class-card"

/**
 * The signed-in reader's next class today after leaving class `sessionId`, as
 * ISO strings — or null (no next class, not a teacher or student, signed out,
 * or any failure: the end screen simply shows no card).
 */
export async function getNextClassAfter(
  sessionId: string
): Promise<NextClassData | null> {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const role = session?.user?.role
    if (!userId || !role) return null
    const { schoolId } = await getTenantContext()
    if (!schoolId || typeof sessionId !== "string" || !sessionId) return null

    // Scoped by school: the id comes from the browser.
    const row = await db.conference.findFirst({
      where: { id: sessionId, schoolId },
      select: { timetableId: true },
    })
    const next = await loadNextClassToday({
      schoolId,
      userId,
      role,
      afterTimetableId: row?.timetableId ?? null,
    })
    if (!next) return null
    return {
      timetableId: next.timetableId,
      subject: next.subject,
      section: next.section,
      startsAt: next.startsAt.toISOString(),
      endsAt: next.endsAt.toISOString(),
    }
  } catch (err) {
    console.error("[live-class] next class lookup failed", {
      err: err instanceof Error ? err.message : err,
    })
    return null
  }
}
