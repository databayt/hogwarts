// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Trip-event → guardian notification helper (M2-5)
//
// NOT a "use server" action — called internally from trip server actions.
// Reuses the existing Notification model. We don't add new
// NotificationType enum values yet; we use system_alert with a
// metadata.kind = "trip_*" tag so the notifications block can render
// trip-specific UI later without a schema change.

import { db } from "@/lib/db"

type TripEventKind =
  | "trip_started"
  | "trip_finished"
  | "trip_cancelled"
  | "boarding_missed"

interface TripEventInput {
  schoolId: string
  tripId: string
  routeId: string
  kind: TripEventKind
  /** Optional explicit student-list. Defaults to all active assignments on the route. */
  studentIds?: string[]
  /** Brief one-liner shown to recipients. Already translated by caller. */
  title: string
  body: string
}

/**
 * Create one Notification per guardian of every affected student.
 * Best-effort: failures don't throw — trip actions shouldn't fail because
 * notifications could not be persisted.
 */
export async function notifyGuardiansOfTripEvent(
  input: TripEventInput
): Promise<{ created: number }> {
  try {
    const { schoolId, tripId, routeId, kind, studentIds, title, body } = input

    const studentSet =
      studentIds && studentIds.length > 0
        ? studentIds
        : (
            await db.routeAssignment.findMany({
              where: {
                schoolId,
                routeId,
                status: "ACTIVE",
                deletedAt: null,
              },
              select: { studentId: true },
            })
          ).map((a) => a.studentId)

    if (studentSet.length === 0) return { created: 0 }

    const guardians = await db.studentGuardian.findMany({
      where: {
        schoolId,
        studentId: { in: studentSet },
      },
      include: {
        guardian: {
          select: {
            id: true,
            user: { select: { id: true } },
          },
        },
      },
    })

    const userIds = Array.from(
      new Set(
        guardians
          .map((g) => g.guardian?.user?.id)
          .filter((u): u is string => Boolean(u))
      )
    )

    if (userIds.length === 0) return { created: 0 }

    await db.notification.createMany({
      data: userIds.map((userId) => ({
        schoolId,
        userId,
        type: "system_alert" as const,
        priority:
          kind === "trip_cancelled" || kind === "boarding_missed"
            ? ("high" as const)
            : ("normal" as const),
        title,
        body,
        metadata: {
          kind,
          tripId,
          routeId,
          url: `/transportation/trips/${tripId}`,
        },
      })),
      skipDuplicates: true,
    })

    return { created: userIds.length }
  } catch {
    // Best-effort — never throw from a notification side-effect.
    return { created: 0 }
  }
}
