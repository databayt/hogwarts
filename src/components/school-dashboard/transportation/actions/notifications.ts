// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Trip-event → guardian notification helper (M2-5)
//
// NOT a "use server" action — called internally from trip server actions.
// Reuses the existing Notification model. Each notification's title/body is
// rendered in the school's preferred language so guardians see their own
// language regardless of who triggered the trip event.

import { db } from "@/lib/db"
import arDict from "@/components/internationalization/dictionaries/ar/transportation.json"
import enDict from "@/components/internationalization/dictionaries/en/transportation.json"

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
  /** Cancel-only: human reason interpolated into the cancelled body. */
  reason?: string
}

type TransportationDict = typeof enDict
type NotificationsDict = TransportationDict["notifications"]

function pickDict(lang: string | null | undefined): TransportationDict {
  return lang === "en" ? enDict : arDict
}

function renderEvent(
  notifications: NotificationsDict,
  kind: TripEventKind,
  reason: string | undefined
): { title: string; body: string } {
  switch (kind) {
    case "trip_started":
      return {
        title: notifications.tripStarted.title,
        body: notifications.tripStarted.body,
      }
    case "trip_finished":
      return {
        title: notifications.tripFinished.title,
        body: notifications.tripFinished.body,
      }
    case "trip_cancelled":
      return {
        title: notifications.tripCancelled.title,
        body: reason
          ? notifications.tripCancelled.bodyWithReason.replace(
              "{reason}",
              reason
            )
          : notifications.tripCancelled.body,
      }
    case "boarding_missed":
      return {
        title: notifications.boardingMissed.title,
        body: notifications.boardingMissed.body,
      }
  }
}

/**
 * Create one Notification per guardian of every affected student.
 * Best-effort: failures don't throw — trip actions shouldn't fail because
 * notifications could not be persisted. Errors are logged for forensics
 * but never surfaced to callers.
 */
export async function notifyGuardiansOfTripEvent(
  input: TripEventInput
): Promise<{ created: number }> {
  const { schoolId, tripId, routeId, kind, studentIds, reason } = input

  try {
    // Resolve school language for localized title/body
    const school = await db.school
      .findUnique({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      .catch(() => null)
    const dict = pickDict(school?.preferredLanguage)
    const { title, body } = renderEvent(dict.notifications, kind, reason)

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

    // Read settings to honor per-event opt-outs (defaults: all true)
    const settings = await db.transportationSettings
      .findUnique({
        where: { schoolId },
        select: {
          notifyGuardiansOnTripStart: true,
          notifyGuardiansOnTripFinish: true,
          notifyGuardiansOnTripCancel: true,
        },
      })
      .catch(() => null)

    if (settings) {
      if (kind === "trip_started" && !settings.notifyGuardiansOnTripStart)
        return { created: 0 }
      if (kind === "trip_finished" && !settings.notifyGuardiansOnTripFinish)
        return { created: 0 }
      if (kind === "trip_cancelled" && !settings.notifyGuardiansOnTripCancel)
        return { created: 0 }
    }

    try {
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
    } catch (err) {
      // Per-write failure: log but never throw.
      console.error("[transportation] notification createMany failed", {
        schoolId,
        tripId,
        kind,
        userCount: userIds.length,
        err: err instanceof Error ? err.message : err,
      })
      return { created: 0 }
    }

    return { created: userIds.length }
  } catch (err) {
    // Best-effort — never throw from a notification side-effect.
    console.error("[transportation] notifyGuardiansOfTripEvent failed", {
      schoolId,
      tripId,
      kind,
      err: err instanceof Error ? err.message : err,
    })
    return { created: 0 }
  }
}
