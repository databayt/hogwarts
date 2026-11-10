// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

/**
 * May this caller act host-side on THIS class — set its homework, launch its
 * quiz, write its room events?
 *
 * Yes for an ADMIN or DEVELOPER, for the class's own teacher, and for anyone
 * holding a HOST or CO_HOST seat in it (the row the join writes: a co-teacher
 * of the section, a substitute, an admin who walked in).
 *
 * These actions used to accept ANY teacher of the school. That mirrored
 * join-core when every teacher co-hosted every class; join-core stopped
 * doing that (a co-host must teach the section), and these were left behind —
 * so a teacher could publish homework to, or start a quiz in, a class of a
 * section they have nothing to do with.
 */
export async function holdsHostSeat(input: {
  schoolId: string
  userId: string
  role: string
  sessionId: string
  /** `Conference.teacher.userId`, when the caller already loaded it. */
  sessionTeacherUserId?: string | null
}): Promise<boolean> {
  if (input.role === "ADMIN" || input.role === "DEVELOPER") return true
  if (input.sessionTeacherUserId && input.sessionTeacherUserId === input.userId)
    return true
  const seat = await db.conferenceParticipant.findFirst({
    where: {
      sessionId: input.sessionId,
      schoolId: input.schoolId,
      userId: input.userId,
      role: { in: ["HOST", "CO_HOST"] },
    },
    select: { id: true },
  })
  return Boolean(seat)
}
