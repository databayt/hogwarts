// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  addRouteStop,
  deleteStop,
  reorderStops,
  updateRouteStop,
} from "@/components/school-dashboard/transportation/actions/stops"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/db", () => ({
  db: {
    route: {
      findFirst: vi.fn(),
    },
    routeStop: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    routeAssignment: {
      count: vi.fn(),
    },
    tripBoarding: {
      count: vi.fn(),
    },
    $transaction: vi.fn(),
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

// A minimally valid input for addRouteStop (routeStopSchema).
function validStopInput(overrides: Record<string, unknown> = {}) {
  return {
    routeId: "route-1",
    name: "Main Gate",
    stopOrder: 1,
    ...overrides,
  }
}

// ===========================================================================
// addRouteStop
// ===========================================================================
describe("addRouteStop", () => {
  it("creates a stop scoped to the tenant schoolId and returns it", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue(null) // no order conflict
    const created = {
      id: "stop-1",
      schoolId: SCHOOL_A,
      routeId: "route-1",
      name: "Main Gate",
      stopOrder: 1,
    }
    vi.mocked(db.routeStop.create).mockResolvedValue(created as never)

    const result = await addRouteStop(validStopInput())

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual(created)

    // route ownership lookup is schoolId scoped + soft-delete aware
    expect(db.route.findFirst).toHaveBeenCalledWith({
      where: { id: "route-1", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true },
    })
    // create persists schoolId from context, not the input
    expect(db.routeStop.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        schoolId: SCHOOL_A,
        routeId: "route-1",
        name: "Main Gate",
        stopOrder: 1,
      }),
    })
  })

  it("returns ROUTE_NOT_FOUND when the route is not in tenant scope", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.route.findFirst).mockResolvedValue(null)

    const result = await addRouteStop(validStopInput())

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NOT_FOUND")
    expect(db.routeStop.create).not.toHaveBeenCalled()
  })

  it("returns STOP_ORDER_CONFLICT when the stopOrder is already taken on the route", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "existing-stop",
    } as never)

    const result = await addRouteStop(validStopInput({ stopOrder: 2 }))

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("STOP_ORDER_CONFLICT")
    // conflict probe is scoped by schoolId + routeId + stopOrder
    expect(db.routeStop.findFirst).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_A, routeId: "route-1", stopOrder: 2 },
      select: { id: true },
    })
    expect(db.routeStop.create).not.toHaveBeenCalled()
  })

  it("returns VALIDATION_ERROR when input fails the schema (empty name)", async () => {
    mockUser("ADMIN", SCHOOL_A)

    const result = await addRouteStop(validStopInput({ name: "" }))

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
    expect(db.route.findFirst).not.toHaveBeenCalled()
  })

  it("returns UNAUTHORIZED when role lacks manage_stop (STUDENT)", async () => {
    mockUser("STUDENT", SCHOOL_A)

    const result = await addRouteStop(validStopInput())

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.route.findFirst).not.toHaveBeenCalled()
  })

  it("returns STOP_CREATE_FAILED when the create throws", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue(null)
    vi.mocked(db.routeStop.create).mockRejectedValue(new Error("db down"))

    const result = await addRouteStop(validStopInput())

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("STOP_CREATE_FAILED")
  })
})

// ===========================================================================
// updateRouteStop
// ===========================================================================
describe("updateRouteStop", () => {
  it("returns STOP_NOT_FOUND when the stop is not in tenant scope", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue(null)

    const result = await updateRouteStop({ id: "stop-1", name: "Renamed" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("STOP_NOT_FOUND")
    // ownership guard is schoolId scoped
    expect(db.routeStop.findFirst).toHaveBeenCalledWith({
      where: { id: "stop-1", schoolId: SCHOOL_A },
      select: { id: true, routeId: true, stopOrder: true },
    })
    expect(db.routeStop.update).not.toHaveBeenCalled()
  })

  it("updates an owned stop and returns the updated row", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
      routeId: "route-1",
      stopOrder: 3,
    } as never)
    const updated = { id: "stop-1", routeId: "route-1", name: "Renamed" }
    vi.mocked(db.routeStop.update).mockResolvedValue(updated as never)

    const result = await updateRouteStop({ id: "stop-1", name: "Renamed" })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual(updated)
    // update targets the id with the parsed data (id stripped out of data)
    expect(db.routeStop.update).toHaveBeenCalledWith({
      where: { id: "stop-1" },
      data: { name: "Renamed" },
    })
    // no order change → no conflict probe (only the ownership findFirst ran)
    expect(db.routeStop.findFirst).toHaveBeenCalledTimes(1)
  })

  it("returns STOP_ORDER_CONFLICT when moving to an occupied order on the same route", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.routeStop.findFirst)
      .mockResolvedValueOnce({
        id: "stop-1",
        routeId: "route-1",
        stopOrder: 3,
      } as never)
      .mockResolvedValueOnce({ id: "other-stop" } as never) // conflict found

    const result = await updateRouteStop({ id: "stop-1", stopOrder: 5 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("STOP_ORDER_CONFLICT")
    // conflict probe excludes self and scopes by school + route + order
    expect(db.routeStop.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        schoolId: SCHOOL_A,
        routeId: "route-1",
        stopOrder: 5,
        NOT: { id: "stop-1" },
      },
      select: { id: true },
    })
    expect(db.routeStop.update).not.toHaveBeenCalled()
  })

  it("returns STOP_UPDATE_FAILED when the update throws", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
      routeId: "route-1",
      stopOrder: 3,
    } as never)
    vi.mocked(db.routeStop.update).mockRejectedValue(new Error("db down"))

    const result = await updateRouteStop({ id: "stop-1", name: "Renamed" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("STOP_UPDATE_FAILED")
  })
})

// ===========================================================================
// reorderStops — two-phase update ordering (constraint never violated mid-tx)
// ===========================================================================
describe("reorderStops", () => {
  it("performs all negative-offset writes BEFORE any final-order write", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    // 3 existing stops on the route, all belong
    vi.mocked(db.routeStop.findMany).mockResolvedValue([
      { id: "s1" },
      { id: "s2" },
      { id: "s3" },
    ] as never)

    // Record the exact sequence of update calls inside the transaction.
    const updateCalls: Array<{ id: string; stopOrder: number }> = []
    vi.mocked(db.routeStop.update).mockImplementation((args: never) => {
      const a = args as {
        where: { id: string }
        data: { stopOrder: number }
      }
      updateCalls.push({ id: a.where.id, stopOrder: a.data.stopOrder })
      return Promise.resolve({} as never)
    })
    // The action passes a callback to $transaction(tx => ...)
    vi.mocked(db.$transaction).mockImplementation(async (fn: never) =>
      (fn as (tx: typeof db) => unknown)(db)
    )

    // New order: s3, s1, s2
    const result = await reorderStops({
      routeId: "route-1",
      stopIds: ["s3", "s1", "s2"],
    })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ routeId: "route-1" })

    // 3 negative-offset writes + 3 final writes = 6 total
    expect(updateCalls).toHaveLength(6)

    const lastNegativeIndex = updateCalls.reduce(
      (acc, call, idx) => (call.stopOrder < 0 ? idx : acc),
      -1
    )
    const firstPositiveIndex = updateCalls.findIndex(
      (call) => call.stopOrder > 0
    )

    // Every negative (offset) write must come before any positive (final) write,
    // otherwise the @@unique([schoolId, routeId, stopOrder]) is violated mid-tx.
    expect(lastNegativeIndex).toBeGreaterThanOrEqual(0)
    expect(firstPositiveIndex).toBeGreaterThanOrEqual(0)
    expect(lastNegativeIndex).toBeLessThan(firstPositiveIndex)

    // Phase 1: negative offsets in input order: -1, -2, -3
    expect(updateCalls.slice(0, 3)).toEqual([
      { id: "s3", stopOrder: -1 },
      { id: "s1", stopOrder: -2 },
      { id: "s2", stopOrder: -3 },
    ])
    // Phase 2: final 1-based orders matching the requested sequence
    expect(updateCalls.slice(3)).toEqual([
      { id: "s3", stopOrder: 1 },
      { id: "s1", stopOrder: 2 },
      { id: "s2", stopOrder: 3 },
    ])
  })

  it("returns ROUTE_NOT_FOUND when the route is not in tenant scope", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.route.findFirst).mockResolvedValue(null)

    const result = await reorderStops({
      routeId: "route-1",
      stopIds: ["s1"],
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NOT_FOUND")
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("returns VALIDATION_ERROR when a stopId does not belong to the route", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    // route only has s1 + s2; caller passes a foreign id (s9)
    vi.mocked(db.routeStop.findMany).mockResolvedValue([
      { id: "s1" },
      { id: "s2" },
    ] as never)

    const result = await reorderStops({
      routeId: "route-1",
      stopIds: ["s1", "s9"],
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
    // stops lookup is schoolId + routeId scoped
    expect(db.routeStop.findMany).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_A, routeId: "route-1" },
      select: { id: true },
    })
    expect(db.$transaction).not.toHaveBeenCalled()
  })

  it("returns VALIDATION_ERROR when the count of ids differs from existing stops", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    // route has 3 stops but caller only passes 2 valid ids → partial reorder rejected
    vi.mocked(db.routeStop.findMany).mockResolvedValue([
      { id: "s1" },
      { id: "s2" },
      { id: "s3" },
    ] as never)

    const result = await reorderStops({
      routeId: "route-1",
      stopIds: ["s1", "s2"],
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// deleteStop
// ===========================================================================
describe("deleteStop", () => {
  it("returns STOP_NOT_FOUND when the stop is not in tenant scope", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue(null)

    const result = await deleteStop("stop-1")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("STOP_NOT_FOUND")
    // ownership guard is schoolId scoped
    expect(db.routeStop.findFirst).toHaveBeenCalledWith({
      where: { id: "stop-1", schoolId: SCHOOL_A },
      select: { id: true, routeId: true },
    })
    expect(db.routeStop.delete).not.toHaveBeenCalled()
  })

  it("returns HAS_DEPENDENCIES when an active assignment uses the stop", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
      routeId: "route-1",
    } as never)
    vi.mocked(db.routeAssignment.count).mockResolvedValue(2 as never)

    const result = await deleteStop("stop-1")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("HAS_DEPENDENCIES")
    // dependency probe scopes school + stop + active + not soft-deleted
    expect(db.routeAssignment.count).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        stopId: "stop-1",
        deletedAt: null,
        status: "ACTIVE",
      },
    })
    expect(db.routeStop.delete).not.toHaveBeenCalled()
  })

  it("deletes an owned stop with no active dependents and returns the id", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
      routeId: "route-1",
    } as never)
    vi.mocked(db.routeAssignment.count).mockResolvedValue(0 as never)
    vi.mocked(db.tripBoarding.count).mockResolvedValue(0 as never)
    vi.mocked(db.routeStop.delete).mockResolvedValue({ id: "stop-1" } as never)

    const result = await deleteStop("stop-1")

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "stop-1" })
    expect(db.routeStop.delete).toHaveBeenCalledWith({
      where: { id: "stop-1" },
    })
  })

  it("blocks delete (HAS_DEPENDENCIES) when historical boardings reference the stop", async () => {
    mockUser("ADMIN", SCHOOL_A)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
      routeId: "route-1",
    } as never)
    // No active assignments, but completed trips left boarding rows that a
    // hard-delete would cascade-wipe.
    vi.mocked(db.routeAssignment.count).mockResolvedValue(0 as never)
    vi.mocked(db.tripBoarding.count).mockResolvedValue(3 as never)

    const result = await deleteStop("stop-1")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("HAS_DEPENDENCIES")
    expect(db.routeStop.delete).not.toHaveBeenCalled()
  })

  it("returns MISSING_SCHOOL when there is no tenant schoolId", async () => {
    mockUser("ADMIN", null)

    const result = await deleteStop("stop-1")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
    expect(db.routeStop.findFirst).not.toHaveBeenCalled()
  })
})
