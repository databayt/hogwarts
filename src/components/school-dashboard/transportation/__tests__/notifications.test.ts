// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Unit tests for notifyGuardiansOfTripEvent (actions/notifications.ts).
// We use the REAL dict JSON imports (en/ar transportation.json) so that
// title/body/interpolation assertions track the shipped copy exactly.
// Only @/lib/db is mocked.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import arDict from "@/components/internationalization/dictionaries/ar/transportation.json"
import enDict from "@/components/internationalization/dictionaries/en/transportation.json"

import { notifyGuardiansOfTripEvent } from "../actions/notifications"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn() },
    route: { findFirst: vi.fn() },
    routeAssignment: { findMany: vi.fn() },
    studentGuardian: { findMany: vi.fn() },
    transportationSettings: { findUnique: vi.fn() },
    notification: { createMany: vi.fn() },
  },
}))

const SCHOOL_A = "school-A"
const TRIP_ID = "trip-1"
const ROUTE_ID = "route-1"
const ROUTE_NAME = "Route 7 — North Loop"

/** Build a guardian row shaped like the source's include. */
function guardianRow(
  guardianId: string,
  userId: string | null,
  studentId = "stud-1"
) {
  return {
    studentId,
    guardian: {
      id: guardianId,
      user: userId ? { id: userId } : null,
    },
  }
}

/**
 * Wire the happy-path DB mocks. Override individual mocks afterward per test.
 * - preferredLanguage: school lang ("en" | "ar" | null)
 * - guardians: studentGuardian.findMany result
 * - settings: transportationSettings.findUnique result (null = no row → all on)
 */
function setupHappyPath(
  opts: {
    preferredLanguage?: string | null
    guardians?: ReturnType<typeof guardianRow>[]
    settings?: Record<string, boolean> | null
    routeName?: string | null
    assignments?: { studentId: string }[]
  } = {}
) {
  const {
    preferredLanguage = "en",
    guardians = [guardianRow("g1", "user-1")],
    settings = null,
    routeName = ROUTE_NAME,
    assignments = [{ studentId: "stud-1" }],
  } = opts

  vi.mocked(db.school.findUnique).mockResolvedValue(
    preferredLanguage === undefined ? null : ({ preferredLanguage } as never)
  )
  vi.mocked(db.route.findFirst).mockResolvedValue(
    routeName === null ? null : ({ name: routeName } as never)
  )
  vi.mocked(db.routeAssignment.findMany).mockResolvedValue(assignments as never)
  vi.mocked(db.studentGuardian.findMany).mockResolvedValue(guardians as never)
  vi.mocked(db.transportationSettings.findUnique).mockResolvedValue(
    settings as never
  )
  vi.mocked(db.notification.createMany).mockResolvedValue({ count: 1 } as never)
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("notifyGuardiansOfTripEvent", () => {
  describe("language selection by school.preferredLanguage", () => {
    it("uses English title/body when preferredLanguage is 'en'", async () => {
      setupHappyPath({ preferredLanguage: "en" })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 1 })
      expect(db.notification.createMany).toHaveBeenCalledTimes(1)
      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data[0].title).toBe(enDict.notifications.tripStarted.title)
      expect(arg.data[0].title).toBe("Bus departed")
      expect(arg.data[0].body).toBe(
        "Your child's bus on Route 7 — North Loop has started its route."
      )
      // Scoped school + route lookups.
      expect(db.school.findUnique).toHaveBeenCalledWith({
        where: { id: SCHOOL_A },
        select: { preferredLanguage: true },
      })
      expect(db.route.findFirst).toHaveBeenCalledWith({
        where: { id: ROUTE_ID, schoolId: SCHOOL_A },
        select: { name: true },
      })
    })

    it("uses Arabic title/body when preferredLanguage is 'ar'", async () => {
      setupHappyPath({ preferredLanguage: "ar" })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 1 })
      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data[0].title).toBe(arDict.notifications.tripStarted.title)
      expect(arg.data[0].body).toBe(
        arDict.notifications.tripStarted.body.replace("{route}", ROUTE_NAME)
      )
      expect(arg.data[0].body).toContain(ROUTE_NAME)
    })

    it("defaults to Arabic when preferredLanguage is null (non-'en')", async () => {
      setupHappyPath({ preferredLanguage: null })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_finished",
      })

      expect(result).toEqual({ created: 1 })
      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data[0].title).toBe(arDict.notifications.tripFinished.title)
    })
  })

  describe("{route} and {reason} interpolation", () => {
    it("interpolates {route} into the finished body", async () => {
      setupHappyPath({ preferredLanguage: "en", routeName: "Express A" })

      await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_finished",
      })

      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data[0].body).toBe(
        "Your child's bus on Express A has completed its route."
      )
      expect(arg.data[0].body).not.toContain("{route}")
    })

    it("substitutes an empty route name when the route lookup returns null", async () => {
      setupHappyPath({ preferredLanguage: "en", routeName: null })

      await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      // {route} → "" leaves a double space where the name would have been.
      expect(arg.data[0].body).toBe(
        "Your child's bus on  has started its route."
      )
      expect(arg.data[0].body).not.toContain("{route}")
    })

    it("uses bodyWithReason and interpolates {reason} for trip_cancelled when reason given", async () => {
      setupHappyPath({ preferredLanguage: "en" })

      await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_cancelled",
        reason: "Heavy snow",
      })

      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data[0].title).toBe(enDict.notifications.tripCancelled.title)
      expect(arg.data[0].body).toBe(
        "Your child's bus trip on Route 7 — North Loop was cancelled: Heavy snow"
      )
      expect(arg.data[0].body).not.toContain("{route}")
      expect(arg.data[0].body).not.toContain("{reason}")
      // Cancelled events are high priority.
      expect(arg.data[0].priority).toBe("high")
    })

    it("uses the plain cancelled body (no reason) when reason omitted", async () => {
      setupHappyPath({ preferredLanguage: "en" })

      await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_cancelled",
      })

      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data[0].body).toBe(
        "Your child's bus trip on Route 7 — North Loop has been cancelled."
      )
      expect(arg.data[0].body).not.toContain("{reason}")
    })
  })

  describe("per-event opt-out via TransportationSettings", () => {
    it("trip_started: returns {created:0} and skips createMany when notifyGuardiansOnTripStart is false", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        settings: {
          notifyGuardiansOnTripStart: false,
          notifyGuardiansOnTripFinish: true,
          notifyGuardiansOnTripCancel: true,
        },
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 0 })
      expect(db.notification.createMany).not.toHaveBeenCalled()
    })

    it("trip_finished: returns {created:0} and skips createMany when notifyGuardiansOnTripFinish is false", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        settings: {
          notifyGuardiansOnTripStart: true,
          notifyGuardiansOnTripFinish: false,
          notifyGuardiansOnTripCancel: true,
        },
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_finished",
      })

      expect(result).toEqual({ created: 0 })
      expect(db.notification.createMany).not.toHaveBeenCalled()
    })

    it("trip_cancelled: returns {created:0} and skips createMany when notifyGuardiansOnTripCancel is false", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        settings: {
          notifyGuardiansOnTripStart: true,
          notifyGuardiansOnTripFinish: true,
          notifyGuardiansOnTripCancel: false,
        },
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_cancelled",
        reason: "Bus broke down",
      })

      expect(result).toEqual({ created: 0 })
      expect(db.notification.createMany).not.toHaveBeenCalled()
    })

    it("boarding_missed: NOT gated by any opt-out flag — still notifies even with all flags false", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        settings: {
          notifyGuardiansOnTripStart: false,
          notifyGuardiansOnTripFinish: false,
          notifyGuardiansOnTripCancel: false,
        },
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "boarding_missed",
      })

      expect(result).toEqual({ created: 1 })
      expect(db.notification.createMany).toHaveBeenCalledTimes(1)
      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data[0].title).toBe(enDict.notifications.boardingMissed.title)
      expect(arg.data[0].priority).toBe("high")
    })
  })

  describe("userId dedup + createMany shape", () => {
    it("collapses two guardians sharing the same user into a single notification", async () => {
      // Two guardian rows (different guardian ids, different students) but same backing user.
      setupHappyPath({
        preferredLanguage: "en",
        guardians: [
          guardianRow("g1", "shared-user", "stud-1"),
          guardianRow("g2", "shared-user", "stud-2"),
        ],
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 1 })
      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data).toHaveLength(1)
      expect(arg.data[0].userId).toBe("shared-user")
      expect(arg.skipDuplicates).toBe(true)
      // Each row is school-scoped + carries forensic metadata.
      expect(arg.data[0].schoolId).toBe(SCHOOL_A)
      expect(arg.data[0].type).toBe("system_alert")
      expect(arg.data[0].metadata).toEqual({
        kind: "trip_started",
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        url: `/transportation/trips/${TRIP_ID}`,
      })
    })

    it("creates one notification per distinct user (created === distinct userIds)", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        guardians: [
          guardianRow("g1", "user-1"),
          guardianRow("g2", "user-2"),
          guardianRow("g3", "user-1"), // dup of user-1
        ],
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_finished",
      })

      expect(result).toEqual({ created: 2 })
      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data).toHaveLength(2)
      expect(arg.data.map((d: { userId: string }) => d.userId)).toEqual([
        "user-1",
        "user-2",
      ])
    })

    it("drops guardians with no linked user before creating notifications", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        guardians: [
          guardianRow("g1", "user-1"),
          guardianRow("g2", null), // no user → filtered
        ],
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 1 })
      const arg = vi.mocked(db.notification.createMany).mock.calls[0][0]
      expect(arg.data.map((d: { userId: string }) => d.userId)).toEqual([
        "user-1",
      ])
    })

    it("returns {created:0} without calling createMany when no guardian has a user", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        guardians: [guardianRow("g1", null)],
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 0 })
      expect(db.notification.createMany).not.toHaveBeenCalled()
      // userIds empty → settings is never read.
      expect(db.transportationSettings.findUnique).not.toHaveBeenCalled()
    })
  })

  describe("explicit studentIds vs default active assignments", () => {
    it("uses explicit studentIds and does NOT query routeAssignment", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        guardians: [guardianRow("g1", "user-1", "stud-9")],
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "boarding_missed",
        studentIds: ["stud-9", "stud-10"],
      })

      expect(result).toEqual({ created: 1 })
      expect(db.routeAssignment.findMany).not.toHaveBeenCalled()
      // Guardians are looked up against the explicit student set, school-scoped.
      expect(db.studentGuardian.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_A,
            studentId: { in: ["stud-9", "stud-10"] },
          }),
        })
      )
    })

    it("falls back to active route assignments (scoped) when no studentIds given", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        assignments: [{ studentId: "a-1" }, { studentId: "a-2" }],
        guardians: [guardianRow("g1", "user-1", "a-1")],
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 1 })
      expect(db.routeAssignment.findMany).toHaveBeenCalledWith({
        where: {
          schoolId: SCHOOL_A,
          routeId: ROUTE_ID,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { studentId: true },
      })
      expect(db.studentGuardian.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_A,
            studentId: { in: ["a-1", "a-2"] },
          }),
        })
      )
    })

    it("returns {created:0} when no studentIds and no active assignments (no guardian lookup)", async () => {
      setupHappyPath({
        preferredLanguage: "en",
        assignments: [],
      })

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 0 })
      expect(db.studentGuardian.findMany).not.toHaveBeenCalled()
      expect(db.notification.createMany).not.toHaveBeenCalled()
    })
  })

  describe("best-effort: never re-throws", () => {
    it("returns {created:0} when createMany throws (inner catch)", async () => {
      setupHappyPath({ preferredLanguage: "en" })
      vi.mocked(db.notification.createMany).mockRejectedValue(
        new Error("db write failed")
      )

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 0 })
      expect(db.notification.createMany).toHaveBeenCalledTimes(1)
    })

    it("returns {created:0} when guardian lookup throws (outer catch)", async () => {
      setupHappyPath({ preferredLanguage: "en" })
      vi.mocked(db.studentGuardian.findMany).mockRejectedValue(
        new Error("connection reset")
      )

      const result = await notifyGuardiansOfTripEvent({
        schoolId: SCHOOL_A,
        tripId: TRIP_ID,
        routeId: ROUTE_ID,
        kind: "trip_started",
      })

      expect(result).toEqual({ created: 0 })
      expect(db.notification.createMany).not.toHaveBeenCalled()
    })
  })
})
