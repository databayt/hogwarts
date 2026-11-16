// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The school's PRACTICE ROOM (غرفة التجربة): one permanent, always-open
// Conference row per school (`isPractice: true`) that every member may enter to
// try camera, mic and screen share before a real class. The School switch
// `conferencePracticeRoom` is the only thing that opens or closes it:
//
//   ON  → `ensurePracticeRoom` creates the row, or re-opens the existing one
//   OFF → `closePracticeRoom` cancels it (the row is kept) and ends its SFU room
//
// Any row with `isPractice: true` IS the practice room — a converted ad-hoc row
// works the same as one created here. A plain server-only module: the settings
// action holds the session and tenant; this holds the rows.
import "server-only"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"

import { closeRoom } from "../livekit/close-room"
import { roomNameFor } from "../livekit/room-naming"

/** "Never ends" — far enough out that no clock, window or cron reaches it. */
export const PRACTICE_ROOM_END = new Date("2099-12-31T00:00:00.000Z")

export const PRACTICE_TITLE = {
  ar: "غرفة التجربة",
  en: "Practice room",
} as const

export type PracticeRoomResult =
  | { success: true }
  | ReturnType<typeof actionError>

/**
 * The first ACTIVE teacher of the school by createdAt — the row's required
 * `teacherId`. `null` when the school has none.
 */
export async function findPracticeTeacher(
  schoolId: string
): Promise<{ id: string } | null> {
  return db.teacher.findFirst({
    where: { schoolId, employmentStatus: "ACTIVE" },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })
}

/**
 * Make sure the school's practice room exists and is open. Idempotent: a
 * missing row is created, a cancelled/ended one is re-opened, a healthy one is
 * left untouched. Returns a clear error (and writes nothing) when the school
 * has no teacher to own a new row.
 */
export async function ensurePracticeRoom(
  schoolId: string
): Promise<PracticeRoomResult> {
  const existing = await db.conference.findFirst({
    where: { schoolId, isPractice: true, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, status: true, scheduledEnd: true },
  })

  if (existing) {
    if (existing.status === "scheduled" || existing.status === "live") {
      if (existing.scheduledEnd.getTime() < PRACTICE_ROOM_END.getTime()) {
        await db.conference.update({
          where: { id: existing.id },
          data: { scheduledEnd: PRACTICE_ROOM_END },
        })
      }
      return { success: true }
    }
    await db.conference.update({
      where: { id: existing.id },
      data: {
        status: "scheduled",
        actualStart: null,
        actualEnd: null,
        roomSid: null,
        scheduledEnd: PRACTICE_ROOM_END,
        recordingEnabled: false,
      },
    })
    return { success: true }
  }

  const teacher = await findPracticeTeacher(schoolId)
  if (!teacher) return actionError(ACTION_ERRORS.LIVE_CLASS_PRACTICE_NO_TEACHER)

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { preferredLanguage: true },
  })
  const lang = school?.preferredLanguage === "en" ? "en" : "ar"

  // Two-step create so the room name embeds the row's own cuid (the webhook
  // recovers the tenant from it), like every other create path.
  const created = await db.conference.create({
    data: {
      schoolId,
      teacherId: teacher.id,
      timetableId: null,
      sectionId: null,
      subjectId: null,
      title: PRACTICE_TITLE[lang],
      lang,
      visibility: "school",
      isPractice: true,
      status: "scheduled",
      scheduledStart: new Date(),
      scheduledEnd: PRACTICE_ROOM_END,
      recordingEnabled: false,
      roomName: `pending-practice-${schoolId}-${Date.now()}`,
    },
    select: { id: true },
  })
  await db.conference.update({
    where: { id: created.id },
    data: { roomName: roomNameFor(schoolId, created.id) },
  })
  return { success: true }
}

/**
 * Switch the room off: every practice row goes `cancelled` (kept, so turning it
 * back on re-opens it), then any SFU room still up is closed so nobody sits in
 * a room the school has closed. Order matters: the row is cancelled FIRST, so
 * the `room_finished` this triggers finds nothing to reset.
 */
export async function closePracticeRoom(schoolId: string): Promise<void> {
  const rows = await db.conference.findMany({
    where: {
      schoolId,
      isPractice: true,
      deletedAt: null,
      status: { in: ["scheduled", "live"] },
    },
    select: { id: true, roomName: true },
  })
  if (rows.length === 0) return
  await db.conference.updateMany({
    where: { schoolId, id: { in: rows.map((r) => r.id) } },
    data: { status: "cancelled" },
  })
  for (const r of rows) await closeRoom(r.roomName)
}
