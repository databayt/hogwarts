// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { notifyGuardiansOfTripEvent } from "../actions/notifications"
import {
  cancelTrip,
  finishTrip,
  recordBoarding,
  restoreTrip,
  scheduleTrip,
  startTrip,
} from "../actions/trips"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    route: {
      findFirst: vi.fn(),
    },
    trip: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    routeAssignment: {
      findMany: vi.fn(),
    },
    tripBoarding: {
      createMany: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
// Mock the notification side-effect (fired with `void`, must not run real code)
vi.mock("../actions/notifications", () => ({
  notifyGuardiansOfTripEvent: vi.fn(),
}))

const SCHOOL_A = "school-A"
const SCHOOL_B = "school-B"

function mockUser(
  role: string,
  schoolId: string | null = SCHOOL_A,
  userId = "user-1"
) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId, role } } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role,
    isPlatformAdmin: role === "DEVELOPER",
  } as never)
}

// Valid input fixtures
const VALID_SCHEDULE = {
  routeId: "route-1",
  direction: "ROUND_TRIP" as const,
  scheduledDate: "2026-06-01T00:00:00.000Z",
  scheduledTime: "07:30",
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default $transaction passes the live db as the tx client (callback form)
  vi.mocked(db.$transaction).mockImplementation(
    async (fn: (tx: typeof db) => unknown) => fn(db)
  )
})

// ===========================================================================
// scheduleTrip
// ===========================================================================

describe("scheduleTrip", () => {
  it("creates a SCHEDULED trip on the happy path, schoolId-scoped", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.trip.findFirst).mockResolvedValue(null) // no dupe
    const created = { id: "trip-1", status: "SCHEDULED", routeId: "route-1" }
    vi.mocked(db.trip.create).mockResolvedValue(created as never)

    const result = await scheduleTrip(VALID_SCHEDULE)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual(created)

    // Route existence lookup is schoolId + deletedAt scoped
    expect(db.route.findFirst).toHaveBeenCalledWith({
      where: { id: "route-1", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true },
    })
    // Dupe pre-check is scoped on the @@unique tuple within the school
    expect(db.trip.findFirst).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        routeId: "route-1",
        scheduledDate: new Date(VALID_SCHEDULE.scheduledDate),
        direction: "ROUND_TRIP",
      },
      select: { id: true },
    })
    // Create persists status SCHEDULED with schoolId
    expect(db.trip.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL_A,
          routeId: "route-1",
          status: "SCHEDULED",
          scheduledTime: "07:30",
        }),
      })
    )
  })

  it("returns ROUTE_NOT_FOUND when the route is not in scope", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue(null)

    const result = await scheduleTrip(VALID_SCHEDULE)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NOT_FOUND")
    // Must not have probed for a dupe nor created
    expect(db.trip.findFirst).not.toHaveBeenCalled()
    expect(db.trip.create).not.toHaveBeenCalled()
  })

  it("returns TRIP_DUPLICATE via the pre-check on the unique tuple conflict", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.trip.findFirst).mockResolvedValue({ id: "existing" } as never)

    const result = await scheduleTrip(VALID_SCHEDULE)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_DUPLICATE")
    // Pre-check short-circuits before any create
    expect(db.trip.create).not.toHaveBeenCalled()
  })

  it("returns VALIDATION_ERROR for malformed input (bad time)", async () => {
    mockUser("ADMIN")

    const result = await scheduleTrip({
      ...VALID_SCHEDULE,
      scheduledTime: "99:99",
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
    expect(db.route.findFirst).not.toHaveBeenCalled()
  })

  it("returns TRIP_CREATE_FAILED when db.trip.create throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.trip.findFirst).mockResolvedValue(null)
    vi.mocked(db.trip.create).mockRejectedValue(new Error("P2002"))

    const result = await scheduleTrip(VALID_SCHEDULE)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_CREATE_FAILED")
  })

  it("returns UNAUTHORIZED for a role lacking manage_trip", async () => {
    mockUser("STUDENT")

    const result = await scheduleTrip(VALID_SCHEDULE)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.route.findFirst).not.toHaveBeenCalled()
  })

  it("returns NOT_AUTHENTICATED when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_A,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    } as never)

    const result = await scheduleTrip(VALID_SCHEDULE)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
  })

  it("returns MISSING_SCHOOL when tenant context has no schoolId", async () => {
    mockUser("ADMIN", null)

    const result = await scheduleTrip(VALID_SCHEDULE)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
  })
})

// ===========================================================================
// startTrip
// ===========================================================================

describe("startTrip", () => {
  it("requires SCHEDULED: rejects IN_PROGRESS with TRIP_INVALID_STATE", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "IN_PROGRESS",
      routeId: "route-1",
    } as never)

    const result = await startTrip({ id: "trip-1" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_INVALID_STATE")
    expect(db.$transaction).not.toHaveBeenCalled()
    expect(notifyGuardiansOfTripEvent).not.toHaveBeenCalled()
  })

  it("returns TRIP_NOT_FOUND when findFirst returns null", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue(null)

    const result = await startTrip({ id: "missing" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_NOT_FOUND")
    // Lookup is schoolId + deletedAt scoped
    expect(db.trip.findFirst).toHaveBeenCalledWith({
      where: { id: "missing", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true, status: true, routeId: true },
    })
  })

  it("happy path: transitions to IN_PROGRESS, auto-populates PENDING boardings, and notifies guardians", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "SCHEDULED",
      routeId: "route-1",
    } as never)
    vi.mocked(db.routeAssignment.findMany).mockResolvedValue([
      { studentId: "stu-1", stopId: "stop-1" },
      { studentId: "stu-2", stopId: "stop-2" },
    ] as never)
    vi.mocked(db.trip.update).mockResolvedValue({ id: "trip-1" } as never)
    vi.mocked(db.tripBoarding.createMany).mockResolvedValue({
      count: 2,
    } as never)

    const result = await startTrip({ id: "trip-1" })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "trip-1" })

    // Active assignments are read scoped by schoolId + routeId + ACTIVE
    expect(db.routeAssignment.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        routeId: "route-1",
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { studentId: true, stopId: true },
    })
    // Transaction was used
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    // Status flipped to IN_PROGRESS inside the tx
    expect(db.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "trip-1" },
        data: expect.objectContaining({ status: "IN_PROGRESS" }),
      })
    )
    // One PENDING boarding per active assignment, schoolId-scoped, skipDuplicates
    expect(db.tripBoarding.createMany).toHaveBeenCalledWith({
      data: [
        {
          schoolId: SCHOOL_A,
          tripId: "trip-1",
          studentId: "stu-1",
          stopId: "stop-1",
          status: "PENDING",
        },
        {
          schoolId: SCHOOL_A,
          tripId: "trip-1",
          studentId: "stu-2",
          stopId: "stop-2",
          status: "PENDING",
        },
      ],
      skipDuplicates: true,
    })
    // Guardians notified with trip_started kind
    expect(notifyGuardiansOfTripEvent).toHaveBeenCalledWith({
      schoolId: SCHOOL_A,
      tripId: "trip-1",
      routeId: "route-1",
      kind: "trip_started",
    })
  })

  it("happy path with no active assignments: skips createMany but still starts", async () => {
    mockUser("STAFF")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-2",
      status: "SCHEDULED",
      routeId: "route-9",
    } as never)
    vi.mocked(db.routeAssignment.findMany).mockResolvedValue([] as never)
    vi.mocked(db.trip.update).mockResolvedValue({ id: "trip-2" } as never)

    const result = await startTrip({ id: "trip-2" })

    expect(result.success).toBe(true)
    expect(db.trip.update).toHaveBeenCalled()
    expect(db.tripBoarding.createMany).not.toHaveBeenCalled()
    expect(notifyGuardiansOfTripEvent).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "trip_started" })
    )
  })

  it("returns TRIP_UPDATE_FAILED when the transaction throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "SCHEDULED",
      routeId: "route-1",
    } as never)
    vi.mocked(db.routeAssignment.findMany).mockResolvedValue([] as never)
    vi.mocked(db.$transaction).mockRejectedValue(new Error("tx boom"))

    const result = await startTrip({ id: "trip-1" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_UPDATE_FAILED")
  })
})

// ===========================================================================
// finishTrip
// ===========================================================================

describe("finishTrip", () => {
  it("requires IN_PROGRESS: rejects SCHEDULED with TRIP_INVALID_STATE", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "SCHEDULED",
    } as never)

    const result = await finishTrip({ id: "trip-1" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_INVALID_STATE")
    expect(db.trip.update).not.toHaveBeenCalled()
    expect(notifyGuardiansOfTripEvent).not.toHaveBeenCalled()
  })

  it("returns TRIP_NOT_FOUND when the trip is not in scope", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue(null)

    const result = await finishTrip({ id: "missing" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_NOT_FOUND")
    expect(db.trip.findFirst).toHaveBeenCalledWith({
      where: { id: "missing", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true, status: true },
    })
  })

  it("happy path: marks COMPLETED and notifies guardians with trip_finished", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "IN_PROGRESS",
    } as never)
    const updated = { id: "trip-1", status: "COMPLETED", routeId: "route-1" }
    vi.mocked(db.trip.update).mockResolvedValue(updated as never)

    const result = await finishTrip({ id: "trip-1", notes: "done" })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual(updated)
    expect(db.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "trip-1" },
        data: expect.objectContaining({ status: "COMPLETED", notes: "done" }),
      })
    )
    expect(notifyGuardiansOfTripEvent).toHaveBeenCalledWith({
      schoolId: SCHOOL_A,
      tripId: "trip-1",
      routeId: "route-1",
      kind: "trip_finished",
    })
  })

  it("returns TRIP_UPDATE_FAILED when the update throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "IN_PROGRESS",
    } as never)
    vi.mocked(db.trip.update).mockRejectedValue(new Error("boom"))

    const result = await finishTrip({ id: "trip-1" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_UPDATE_FAILED")
  })
})

// ===========================================================================
// cancelTrip
// ===========================================================================

describe("cancelTrip", () => {
  it("cancels a SCHEDULED trip and notifies guardians with reason", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "SCHEDULED",
    } as never)
    const updated = { id: "trip-1", status: "CANCELLED", routeId: "route-1" }
    vi.mocked(db.trip.update).mockResolvedValue(updated as never)

    const result = await cancelTrip({ id: "trip-1", reason: "weather" })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual(updated)
    expect(db.trip.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "trip-1" },
        data: expect.objectContaining({
          status: "CANCELLED",
          notes: "weather",
        }),
      })
    )
    expect(notifyGuardiansOfTripEvent).toHaveBeenCalledWith({
      schoolId: SCHOOL_A,
      tripId: "trip-1",
      routeId: "route-1",
      kind: "trip_cancelled",
      reason: "weather",
    })
  })

  it("cancels an IN_PROGRESS trip", async () => {
    mockUser("STAFF")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-2",
      status: "IN_PROGRESS",
    } as never)
    vi.mocked(db.trip.update).mockResolvedValue({
      id: "trip-2",
      status: "CANCELLED",
      routeId: "route-2",
    } as never)

    const result = await cancelTrip({ id: "trip-2" })

    expect(result.success).toBe(true)
    expect(db.trip.update).toHaveBeenCalled()
  })

  it("rejects a COMPLETED trip with TRIP_INVALID_STATE", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "COMPLETED",
    } as never)

    const result = await cancelTrip({ id: "trip-1" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_INVALID_STATE")
    expect(db.trip.update).not.toHaveBeenCalled()
  })

  it("rejects an already-CANCELLED trip with TRIP_INVALID_STATE", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      status: "CANCELLED",
    } as never)

    const result = await cancelTrip({ id: "trip-1" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_INVALID_STATE")
  })

  it("returns TRIP_NOT_FOUND when the trip is not in scope", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue(null)

    const result = await cancelTrip({ id: "missing" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_NOT_FOUND")
  })
})

// ===========================================================================
// recordBoarding
// ===========================================================================

describe("recordBoarding", () => {
  const VALID_BOARDING = {
    tripId: "trip-1",
    studentId: "stu-1",
    stopId: "stop-1",
    status: "BOARDED" as const,
  }

  it("requires IN_PROGRESS: upserts the boarding and returns it", async () => {
    mockUser("TEACHER")
    vi.mocked(db.trip.findFirst).mockResolvedValue({ id: "trip-1" } as never)
    const boarding = { id: "b-1", status: "BOARDED" }
    vi.mocked(db.tripBoarding.upsert).mockResolvedValue(boarding as never)

    const result = await recordBoarding(VALID_BOARDING)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual(boarding)
    // The IN_PROGRESS guard is baked into the where clause, schoolId-scoped
    expect(db.trip.findFirst).toHaveBeenCalledWith({
      where: {
        id: "trip-1",
        schoolId: SCHOOL_A,
        deletedAt: null,
        status: "IN_PROGRESS",
      },
      select: { id: true },
    })
    // Upsert keyed by the composite unique, scoped by schoolId
    expect(db.tripBoarding.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId_tripId_studentId: {
            schoolId: SCHOOL_A,
            tripId: "trip-1",
            studentId: "stu-1",
          },
        },
      })
    )
  })

  it("returns TRIP_INVALID_STATE when the trip is not IN_PROGRESS (findFirst null)", async () => {
    mockUser("ADMIN")
    // The IN_PROGRESS filter is in the query, so a non-running trip returns null
    vi.mocked(db.trip.findFirst).mockResolvedValue(null)

    const result = await recordBoarding(VALID_BOARDING)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_INVALID_STATE")
    expect(db.tripBoarding.upsert).not.toHaveBeenCalled()
  })

  it("returns BOARDING_UPDATE_FAILED when the upsert throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({ id: "trip-1" } as never)
    vi.mocked(db.tripBoarding.upsert).mockRejectedValue(new Error("boom"))

    const result = await recordBoarding(VALID_BOARDING)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("BOARDING_UPDATE_FAILED")
  })

  it("returns UNAUTHORIZED for a role lacking record_boarding (STUDENT)", async () => {
    mockUser("STUDENT")

    const result = await recordBoarding(VALID_BOARDING)

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.trip.findFirst).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// restoreTrip
// ===========================================================================

describe("restoreTrip", () => {
  it("clears deletedAt for a soft-deleted trip in scope", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      deletedAt: new Date("2026-01-01T00:00:00.000Z"),
    } as never)
    vi.mocked(db.trip.update).mockResolvedValue({ id: "trip-1" } as never)

    const result = await restoreTrip("trip-1")

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "trip-1" })
    // Lookup is schoolId-scoped (no deletedAt filter so deleted rows are visible)
    expect(db.trip.findFirst).toHaveBeenCalledWith({
      where: { id: "trip-1", schoolId: SCHOOL_A },
      select: { id: true, deletedAt: true },
    })
    // Restore sets deletedAt back to null
    expect(db.trip.update).toHaveBeenCalledWith({
      where: { id: "trip-1" },
      data: { deletedAt: null },
    })
  })

  it("is a no-op (returns success without update) when trip is not deleted", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue({
      id: "trip-1",
      deletedAt: null,
    } as never)

    const result = await restoreTrip("trip-1")

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "trip-1" })
    expect(db.trip.update).not.toHaveBeenCalled()
  })

  it("returns TRIP_NOT_FOUND when the trip does not exist in scope", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findFirst).mockResolvedValue(null)

    const result = await restoreTrip("missing")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("TRIP_NOT_FOUND")
    expect(db.trip.update).not.toHaveBeenCalled()
  })

  it("does not leak across tenants: scopes the lookup by the caller's schoolId", async () => {
    mockUser("ADMIN", SCHOOL_B)
    vi.mocked(db.trip.findFirst).mockResolvedValue(null)

    await restoreTrip("trip-1")

    expect(db.trip.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_B }),
      })
    )
    expect(db.trip.findFirst).not.toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ schoolId: SCHOOL_A }),
      })
    )
  })
})
