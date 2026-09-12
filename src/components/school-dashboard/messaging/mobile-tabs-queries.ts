// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Read-only queries behind the mobile tab bar's Updates and Calls pages.
 *
 * Neither is messaging data — Updates reads the school's announcements and
 * Calls reads the viewer's live-class sessions — but both are surfaces of the
 * WhatsApp shell, so they live with it. Every query is school-scoped and
 * additionally narrowed to what this viewer is allowed to see.
 */

import type { UserRole } from "@prisma/client"

import { db } from "@/lib/db"

export type MobileUpdateRow = {
  id: string
  title: string | null
  body: string | null
  priority: string
  scope: string
  publishedAt: string | null
  authorName: string | null
  authorImage: string | null
}

export type MobileCallRow = {
  id: string
  title: string
  subtitle: string | null
  /** joined = the viewer was in the room; missed = it ran without them. */
  outcome: "joined" | "missed" | "upcoming" | "live"
  at: string
  durationSeconds: number | null
  hostName: string | null
}

/**
 * Every class the viewer belongs to, whichever way they belong to one.
 * Class-scoped announcements are matched against this set.
 */
async function viewerClassIds(
  schoolId: string,
  userId: string,
  role: UserRole
): Promise<string[]> {
  if (role === "STUDENT") {
    const rows = await db.studentClass.findMany({
      where: { schoolId, student: { userId } },
      select: { classId: true },
    })
    return rows.map((r) => r.classId)
  }

  if (role === "TEACHER") {
    const rows = await db.class.findMany({
      where: { schoolId, teacher: { userId } },
      select: { id: true },
    })
    return rows.map((r) => r.id)
  }

  if (role === "GUARDIAN") {
    const rows = await db.studentClass.findMany({
      where: {
        schoolId,
        student: {
          studentGuardians: { some: { guardian: { userId } } },
        },
      },
      select: { classId: true },
    })
    return rows.map((r) => r.classId)
  }

  return []
}

/**
 * Announcements this viewer is an audience for: school-wide, addressed to
 * their role, or attached to one of their classes. An ADMIN or DEVELOPER runs
 * the school, so they see every published notice.
 *
 * Deliberately NOT the shape of `/api/mobile/announcements`, which filters on
 * `published` alone — that would show a student the staff-only notices.
 */
export async function getMobileUpdates(
  schoolId: string,
  userId: string,
  role: UserRole,
  take = 20
): Promise<MobileUpdateRow[]> {
  const now = new Date()
  const seesEverything = role === "ADMIN" || role === "DEVELOPER"

  const audience = seesEverything
    ? undefined
    : {
        OR: [
          { scope: "school" as const },
          { scope: "role" as const, role },
          {
            scope: "class" as const,
            classId: { in: await viewerClassIds(schoolId, userId, role) },
          },
        ],
      }

  const rows = await db.announcement.findMany({
    where: {
      schoolId,
      published: true,
      wizardStep: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(audience ?? {}),
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      title: true,
      body: true,
      priority: true,
      scope: true,
      publishedAt: true,
      createdAt: true,
      creator: { select: { username: true, image: true } },
    },
  })

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    priority: String(r.priority),
    scope: String(r.scope),
    publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
    authorName: r.creator?.username ?? null,
    authorImage: r.creator?.image ?? null,
  }))
}

/**
 * The viewer's live-class history, newest first.
 *
 * WhatsApp's incoming/outgoing/missed has no equivalent here, so the three
 * outcomes are the honest ones for a class: they were in the room, the room
 * ran without them, or it has not started yet.
 */
export async function getMobileCalls(
  schoolId: string,
  userId: string,
  take = 20
): Promise<MobileCallRow[]> {
  const rows = await db.conferenceParticipant.findMany({
    where: { schoolId, userId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      joinedAt: true,
      durationSeconds: true,
      createdAt: true,
      session: {
        select: {
          id: true,
          title: true,
          status: true,
          scheduledStart: true,
          actualStart: true,
          actualEnd: true,
          subject: { select: { name: true } },
          section: { select: { name: true } },
          teacher: { select: { firstName: true, lastName: true } },
        },
      },
    },
  })

  return rows.map((r) => {
    const s = r.session
    const at = s.actualStart ?? s.scheduledStart ?? r.createdAt
    const host = s.teacher
      ? `${s.teacher.firstName} ${s.teacher.lastName}`.trim()
      : null

    let outcome: MobileCallRow["outcome"]
    if (s.status === "live") outcome = "live"
    else if (r.joinedAt || (r.durationSeconds ?? 0) > 0) outcome = "joined"
    else if (s.status === "scheduled") outcome = "upcoming"
    else outcome = "missed"

    // Seeded session titles already read "Subject - Section", so repeating the
    // section underneath would print it twice in the same row.
    const title = s.title || s.subject?.name || host || ""
    const section = s.section?.name ?? null

    return {
      id: s.id,
      title,
      subtitle: section && !title.includes(section) ? section : null,
      outcome,
      at: at.toISOString(),
      durationSeconds: r.durationSeconds ?? null,
      hostName: host,
    }
  })
}
