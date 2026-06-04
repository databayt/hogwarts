// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Resolves the "Join live class" target for timetable schedule entries.
// Kept separate from the (huge) actions.ts so it can be unit-tested in
// isolation — it depends only on `db`.

import { db } from "@/lib/db"

/**
 * Live-class Join info attached to a today-schedule entry. `sessionId` is
 * present only for an actual scheduled session (LiveKit room or external);
 * a recurring `LiveClassDefaultLink` resolves with `sessionId: null`.
 */
export type LiveClassJoinInfo = {
  sessionId: string | null
  provider: "livekit" | "external"
  meetingUrl: string | null
  status: string | null
}

/**
 * Resolve a Join target for each schedule entry: prefer a session scheduled
 * today for the (section, subject), else the stable default link. Time-gating
 * (only showing the button in the live window) is the view's responsibility.
 *
 * Tenant safety: every query is scoped by the passed `schoolId` (resolved from
 * the request context upstream, never from client input).
 */
export async function attachLiveClasses<
  T extends { sectionId?: string | null; subjectId?: string | null },
>(
  schoolId: string,
  termId: string,
  date: Date,
  entries: T[]
): Promise<(T & { liveClass: LiveClassJoinInfo | null })[]> {
  const sectionIds = [
    ...new Set(entries.map((e) => e.sectionId).filter(Boolean)),
  ] as string[]
  const subjectIds = [
    ...new Set(entries.map((e) => e.subjectId).filter(Boolean)),
  ] as string[]
  if (sectionIds.length === 0 || subjectIds.length === 0) {
    return entries.map((e) => ({ ...e, liveClass: null }))
  }

  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const [sessions, defaults] = await Promise.all([
    db.liveClassSession.findMany({
      where: {
        schoolId,
        sectionId: { in: sectionIds },
        subjectId: { in: subjectIds },
        status: { in: ["scheduled", "live"] },
        scheduledStart: { gte: dayStart, lte: dayEnd },
        deletedAt: null,
      },
      select: {
        id: true,
        provider: true,
        meetingUrl: true,
        status: true,
        sectionId: true,
        subjectId: true,
      },
      orderBy: { scheduledStart: "asc" },
    }),
    db.liveClassDefaultLink.findMany({
      where: {
        schoolId,
        termId,
        sectionId: { in: sectionIds },
        subjectId: { in: subjectIds },
      },
      select: {
        sectionId: true,
        subjectId: true,
        provider: true,
        meetingUrl: true,
      },
    }),
  ])

  const keyOf = (sec: string, sub: string) => `${sec}:${sub}`
  const sessionMap = new Map<string, (typeof sessions)[number]>()
  for (const s of sessions) {
    if (!s.sectionId || !s.subjectId) continue
    const k = keyOf(s.sectionId, s.subjectId)
    if (!sessionMap.has(k)) sessionMap.set(k, s) // earliest today wins
  }
  const defaultMap = new Map<string, (typeof defaults)[number]>()
  for (const d of defaults) defaultMap.set(keyOf(d.sectionId, d.subjectId), d)

  return entries.map((e) => {
    if (!e.sectionId || !e.subjectId) return { ...e, liveClass: null }
    const k = keyOf(e.sectionId, e.subjectId)
    const sess = sessionMap.get(k)
    if (sess) {
      return {
        ...e,
        liveClass: {
          sessionId: sess.id,
          provider: sess.provider,
          meetingUrl: sess.meetingUrl,
          status: sess.status,
        },
      }
    }
    const def = defaultMap.get(k)
    if (def) {
      return {
        ...e,
        liveClass: {
          sessionId: null,
          provider: def.provider,
          meetingUrl: def.meetingUrl,
          status: null,
        },
      }
    }
    return { ...e, liveClass: null }
  })
}
