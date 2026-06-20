// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Trip-event → guardian notification helper (M2-5)
//
// NOT a "use server" action — called internally from trip server actions.
// Reuses the existing Notification model. Each notification's title/body is
// rendered in the school's preferred language so guardians see their own
// language regardless of who triggered the trip event.

import { NotificationChannel } from "@prisma/client"

import { db } from "@/lib/db"
import arDict from "@/components/internationalization/dictionaries/ar/transportation.json"
import enDict from "@/components/internationalization/dictionaries/en/transportation.json"

type TripEventKind =
  | "trip_started"
  | "trip_finished"
  | "trip_cancelled"
  | "boarding_missed"
  | "student_boarded"
  | "student_alighted"
  | "bus_approaching"
  | "route_changed"

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
  reason: string | undefined,
  routeName: string
): { title: string; body: string } {
  const fill = (s: string) => s.replace("{route}", routeName)
  switch (kind) {
    case "trip_started":
      return {
        title: notifications.tripStarted.title,
        body: fill(notifications.tripStarted.body),
      }
    case "trip_finished":
      return {
        title: notifications.tripFinished.title,
        body: fill(notifications.tripFinished.body),
      }
    case "trip_cancelled":
      return {
        title: notifications.tripCancelled.title,
        body: reason
          ? fill(notifications.tripCancelled.bodyWithReason).replace(
              "{reason}",
              reason
            )
          : fill(notifications.tripCancelled.body),
      }
    case "boarding_missed":
      return {
        title: notifications.boardingMissed.title,
        body: fill(notifications.boardingMissed.body),
      }
    case "student_boarded":
      return {
        title: notifications.studentBoarded.title,
        body: fill(notifications.studentBoarded.body),
      }
    case "student_alighted":
      return {
        title: notifications.studentAlighted.title,
        body: fill(notifications.studentAlighted.body),
      }
    case "bus_approaching":
      return {
        title: notifications.busApproaching.title,
        body: fill(notifications.busApproaching.body),
      }
    case "route_changed":
      return {
        title: notifications.routeChanged.title,
        body: fill(notifications.routeChanged.body),
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
    // Resolve school language + route name + opt-out settings up front, in one
    // round. Reading settings here lets us honor a per-event opt-out BEFORE the
    // expensive assignment→guardian fan-out below (previously settings were read
    // last, after that work was already done and then thrown away).
    const [school, route, settings] = await Promise.all([
      db.school
        .findUnique({
          where: { id: schoolId },
          select: { preferredLanguage: true },
        })
        .catch(() => null),
      db.route
        .findFirst({
          where: { id: routeId, schoolId },
          select: { name: true },
        })
        .catch(() => null),
      db.transportationSettings
        .findUnique({
          where: { schoolId },
          select: {
            notifyGuardiansOnTripStart: true,
            notifyGuardiansOnTripFinish: true,
            notifyGuardiansOnTripCancel: true,
          },
        })
        .catch(() => null),
    ])

    // Per-event opt-outs (defaults: all true) — short-circuit before any
    // assignment/guardian queries.
    if (settings) {
      if (kind === "trip_started" && !settings.notifyGuardiansOnTripStart)
        return { created: 0 }
      if (kind === "trip_finished" && !settings.notifyGuardiansOnTripFinish)
        return { created: 0 }
      if (kind === "trip_cancelled" && !settings.notifyGuardiansOnTripCancel)
        return { created: 0 }
    }

    const dict = pickDict(school?.preferredLanguage)
    const routeName = route?.name ?? ""
    const { title, body } = renderEvent(
      dict.notifications,
      kind,
      reason,
      routeName
    )

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

    try {
      await db.notification.createMany({
        data: userIds.map((userId) => ({
          schoolId,
          userId,
          type: "system_alert" as const,
          priority:
            kind === "trip_cancelled" ||
            kind === "boarding_missed" ||
            kind === "route_changed"
              ? ("high" as const)
              : ("normal" as const),
          // Deliver in-app AND via WhatsApp — the process-whatsapp-notifications
          // cron sweeps rows whose channels include "whatsapp" and resolves the
          // guardian's phone. Guardians without a phone simply get in-app only.
          channels: [NotificationChannel.in_app, NotificationChannel.whatsapp],
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
