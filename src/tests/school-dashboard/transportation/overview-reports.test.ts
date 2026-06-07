// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Unit tests for transportation overview + reports read-only actions.
// Covers: getExpiringDocuments (30-day cutoff window), getRecentAssignments
// (order + take), getDriverHours (per-driver minute aggregation + sort),
// getTripStats (status counts + completionRate math + read_school gate).

import { auth } from "@/auth"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getExpiringDocuments, getRecentAssignments } from "@/components/school-dashboard/transportation/actions/overview"
import { getDriverHours, getTripStats } from "@/components/school-dashboard/transportation/actions/reports"

vi.mock("@/lib/db", () => ({
  db: {
    driver: {
      findMany: vi.fn(),
    },
    vehicle: {
      findMany: vi.fn(),
    },
    routeAssignment: {
      findMany: vi.fn(),
    },
    trip: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const SCHOOL_A = "school-A"

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

beforeEach(() => {
  vi.clearAllMocks()
})
afterEach(() => {
  vi.useRealTimers()
})

describe("getExpiringDocuments", () => {
  it("queries drivers + vehicles with a 30-day cutoff window, schoolId-scoped, take 20", async () => {
    // Freeze time so we can assert the exact cutoff = now + 30 days.
    const now = new Date("2026-05-29T00:00:00.000Z")
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const expectedCutoff = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30)

    mockUser("ADMIN")
    vi.mocked(db.driver.findMany).mockResolvedValue([])
    vi.mocked(db.vehicle.findMany).mockResolvedValue([])

    const result = await getExpiringDocuments()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.drivers).toEqual([])
      expect(result.data.vehicles).toEqual([])
      // asOf is the frozen `now`.
      expect(result.data.asOf).toBe(now.toISOString())
    }

    // Drivers: licenseExpiry lte cutoff, schoolId-scoped, soft-delete excluded.
    expect(db.driver.findMany).toHaveBeenCalledTimes(1)
    const driverArgs = vi.mocked(db.driver.findMany).mock.calls[0][0] as Record<
      string,
      unknown
    >
    expect(driverArgs.where).toMatchObject({
      schoolId: SCHOOL_A,
      deletedAt: null,
      licenseExpiry: { lte: expectedCutoff },
    })
    expect(driverArgs.take).toBe(20)
    expect(driverArgs.orderBy).toEqual({ licenseExpiry: "asc" })

    // Vehicles: OR(registrationExpiry lte cutoff, insuranceExpiry lte cutoff).
    expect(db.vehicle.findMany).toHaveBeenCalledTimes(1)
    const vehicleArgs = vi.mocked(db.vehicle.findMany).mock
      .calls[0][0] as Record<string, unknown>
    expect(vehicleArgs.where).toMatchObject({
      schoolId: SCHOOL_A,
      deletedAt: null,
      OR: [
        { registrationExpiry: { lte: expectedCutoff } },
        { insuranceExpiry: { lte: expectedCutoff } },
      ],
    })
    expect(vehicleArgs.take).toBe(20)
    expect(vehicleArgs.orderBy).toEqual({ plateNumber: "asc" })
  })

  it("returns LOAD_FAILED when a query throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findMany).mockRejectedValue(new Error("db down"))
    vi.mocked(db.vehicle.findMany).mockResolvedValue([])

    const result = await getExpiringDocuments()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("LOAD_FAILED")
  })

  it("denies read_school for a STUDENT before touching the db", async () => {
    mockUser("STUDENT")

    const result = await getExpiringDocuments()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.driver.findMany).not.toHaveBeenCalled()
    expect(db.vehicle.findMany).not.toHaveBeenCalled()
  })
})

describe("getRecentAssignments", () => {
  it("scopes by schoolId, orders by createdAt desc, and applies the limit", async () => {
    mockUser("ADMIN")
    const rows = [
      { id: "ra-1", student: { id: "s1" }, route: { id: "r1" }, stop: null },
    ]
    vi.mocked(db.routeAssignment.findMany).mockResolvedValue(rows as never)

    const result = await getRecentAssignments(5)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(rows)

    expect(db.routeAssignment.findMany).toHaveBeenCalledTimes(1)
    const args = vi.mocked(db.routeAssignment.findMany).mock
      .calls[0][0] as Record<string, unknown>
    expect(args.where).toMatchObject({ schoolId: SCHOOL_A, deletedAt: null })
    expect(args.orderBy).toEqual({ createdAt: "desc" })
    expect(args.take).toBe(5)
  })

  it("defaults take to 10 when no limit is passed", async () => {
    mockUser("ADMIN")
    vi.mocked(db.routeAssignment.findMany).mockResolvedValue([] as never)

    await getRecentAssignments()

    const args = vi.mocked(db.routeAssignment.findMany).mock
      .calls[0][0] as Record<string, unknown>
    expect(args.take).toBe(10)
  })

  it("returns MISSING_SCHOOL when tenant context has no schoolId", async () => {
    mockUser("ADMIN", null)

    const result = await getRecentAssignments()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
    expect(db.routeAssignment.findMany).not.toHaveBeenCalled()
  })
})

describe("getDriverHours", () => {
  it("aggregates completed-trip minutes per driver and sorts by totalMinutes desc", async () => {
    mockUser("ADMIN")
    const base = new Date("2026-05-20T08:00:00.000Z")
    // Driver A: two trips → 30 + 90 = 120 min, 2 trips.
    // Driver B: one trip → 60 min, 1 trip.
    const trips = [
      {
        driverId: "drv-A",
        actualStartTime: new Date(base.getTime()),
        actualEndTime: new Date(base.getTime() + 30 * 60000),
        driver: { id: "drv-A", firstName: "Ann", lastName: "Lee" },
      },
      {
        driverId: "drv-B",
        actualStartTime: new Date(base.getTime()),
        actualEndTime: new Date(base.getTime() + 60 * 60000),
        driver: { id: "drv-B", firstName: "Bob", lastName: "Kim" },
      },
      {
        driverId: "drv-A",
        actualStartTime: new Date(base.getTime()),
        actualEndTime: new Date(base.getTime() + 90 * 60000),
        driver: { id: "drv-A", firstName: "Ann", lastName: "Lee" },
      },
    ]
    vi.mocked(db.trip.findMany).mockResolvedValue(trips as never)

    const result = await getDriverHours()

    expect(result.success).toBe(true)
    if (result.success) {
      // Sorted by totalMinutes desc → A (120) before B (60).
      expect(result.data).toEqual([
        {
          driverId: "drv-A",
          firstName: "Ann",
          lastName: "Lee",
          completedTrips: 2,
          totalMinutes: 120,
        },
        {
          driverId: "drv-B",
          firstName: "Bob",
          lastName: "Kim",
          completedTrips: 1,
          totalMinutes: 60,
        },
      ])
    }
  })

  it("only counts COMPLETED trips with non-null times in scope, schoolId + day cutoff", async () => {
    const now = new Date("2026-05-29T00:00:00.000Z")
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const expectedCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    mockUser("ADMIN")
    vi.mocked(db.trip.findMany).mockResolvedValue([] as never)

    await getDriverHours(7)

    expect(db.trip.findMany).toHaveBeenCalledTimes(1)
    const args = vi.mocked(db.trip.findMany).mock.calls[0][0] as Record<
      string,
      unknown
    >
    expect(args.where).toMatchObject({
      schoolId: SCHOOL_A,
      deletedAt: null,
      status: "COMPLETED",
      actualEndTime: { gte: expectedCutoff, not: null },
      actualStartTime: { not: null },
      driverId: { not: null },
    })
  })

  it("skips rows missing driver/times and clamps negative durations to 0", async () => {
    mockUser("ADMIN")
    const base = new Date("2026-05-20T08:00:00.000Z")
    const trips = [
      // No driver relation → skipped.
      {
        driverId: "drv-X",
        actualStartTime: base,
        actualEndTime: new Date(base.getTime() + 10 * 60000),
        driver: null,
      },
      // End before start → Math.max(0, ...) clamps to 0 minutes, still 1 trip.
      {
        driverId: "drv-C",
        actualStartTime: new Date(base.getTime() + 60 * 60000),
        actualEndTime: base,
        driver: { id: "drv-C", firstName: "Cy", lastName: "Doe" },
      },
    ]
    vi.mocked(db.trip.findMany).mockResolvedValue(trips as never)

    const result = await getDriverHours()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual([
        {
          driverId: "drv-C",
          firstName: "Cy",
          lastName: "Doe",
          completedTrips: 1,
          totalMinutes: 0,
        },
      ])
    }
  })

  it("returns LOAD_FAILED when the trip query throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.trip.findMany).mockRejectedValue(new Error("boom"))

    const result = await getDriverHours()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("LOAD_FAILED")
  })
})

describe("getTripStats", () => {
  it("counts statuses and computes completionRate = completed / (completed + cancelled)", async () => {
    mockUser("ADMIN")
    // 6 completed, 2 cancelled → 6 / 8 = 75%.
    const trips = [
      { status: "SCHEDULED" },
      { status: "SCHEDULED" },
      { status: "IN_PROGRESS" },
      { status: "COMPLETED" },
      { status: "COMPLETED" },
      { status: "COMPLETED" },
      { status: "COMPLETED" },
      { status: "COMPLETED" },
      { status: "COMPLETED" },
      { status: "CANCELLED" },
      { status: "CANCELLED" },
    ]
    vi.mocked(db.trip.findMany).mockResolvedValue(trips as never)

    const result = await getTripStats()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual({
        totalScheduled: 2,
        totalInProgress: 1,
        totalCompleted: 6,
        totalCancelled: 2,
        completionRate: 75,
      })
    }
  })

  it("returns completionRate 0 when there are no decided (completed+cancelled) trips", async () => {
    mockUser("ADMIN")
    const trips = [{ status: "SCHEDULED" }, { status: "IN_PROGRESS" }]
    vi.mocked(db.trip.findMany).mockResolvedValue(trips as never)

    const result = await getTripStats()

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.completionRate).toBe(0)
      expect(result.data.totalScheduled).toBe(1)
      expect(result.data.totalInProgress).toBe(1)
      expect(result.data.totalCompleted).toBe(0)
      expect(result.data.totalCancelled).toBe(0)
    }
  })

  it("scopes the trip query by schoolId with a scheduledDate day cutoff", async () => {
    const now = new Date("2026-05-29T00:00:00.000Z")
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const expectedCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    mockUser("ADMIN")
    vi.mocked(db.trip.findMany).mockResolvedValue([] as never)

    await getTripStats()

    expect(db.trip.findMany).toHaveBeenCalledTimes(1)
    const args = vi.mocked(db.trip.findMany).mock.calls[0][0] as Record<
      string,
      unknown
    >
    expect(args.where).toMatchObject({
      schoolId: SCHOOL_A,
      deletedAt: null,
      scheduledDate: { gte: expectedCutoff },
    })
    expect(args.select).toEqual({ status: true })
  })

  it("enforces the read_school gate (TEACHER lacks it) before querying", async () => {
    mockUser("TEACHER")

    const result = await getTripStats()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.trip.findMany).not.toHaveBeenCalled()
  })

  it("returns NOT_AUTHENTICATED when there is no session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_A,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    } as never)

    const result = await getTripStats()

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
    expect(db.trip.findMany).not.toHaveBeenCalled()
  })
})
