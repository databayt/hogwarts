// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { listAssignments } from "@/components/school-dashboard/transportation/actions/assignments"
import { listDrivers } from "@/components/school-dashboard/transportation/actions/drivers"
import { previewTransportFees } from "@/components/school-dashboard/transportation/actions/fees"
import { getOverviewStats } from "@/components/school-dashboard/transportation/actions/overview"
import { getRouteUtilization } from "@/components/school-dashboard/transportation/actions/reports"
import { listRoutes } from "@/components/school-dashboard/transportation/actions/routes"
import {
  listTrips,
  startTrip,
} from "@/components/school-dashboard/transportation/actions/trips"
import { listVehicles } from "@/components/school-dashboard/transportation/actions/vehicles"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    vehicle: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    driver: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    route: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    routeAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    trip: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    tripBoarding: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_A = "school-A"
const SCHOOL_B = "school-B"

function mockAdmin(schoolId: string) {
  vi.mocked(auth).mockResolvedValue({
    user: { id: `user-of-${schoolId}`, role: "ADMIN" },
  } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role: "ADMIN",
    isPlatformAdmin: false,
  } as never)
}

describe("Transportation multi-tenant isolation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listVehicles", () => {
    it("scopes findMany by schoolId from tenant context", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.vehicle.findMany).mockResolvedValue([])

      await listVehicles()

      expect(db.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_A,
            deletedAt: null,
          }),
        })
      )
      expect(db.vehicle.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_B }),
        })
      )
    })

    it("returns MISSING_SCHOOL when no schoolId", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-A", role: "ADMIN" },
      } as never)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: null,
        role: "ADMIN",
        isPlatformAdmin: false,
      } as never)

      const result = await listVehicles()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
      expect(db.vehicle.findMany).not.toHaveBeenCalled()
    })

    it("returns NOT_AUTHENTICATED when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL_A,
        requestId: null,
        role: null,
        isPlatformAdmin: false,
      } as never)

      const result = await listVehicles()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
    })

    it("UNAUTHORIZED when role lacks read_school", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-A", role: "STUDENT" },
      } as never)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL_A,
        requestId: null,
        role: "STUDENT",
        isPlatformAdmin: false,
      } as never)

      const result = await listVehicles()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
      expect(db.vehicle.findMany).not.toHaveBeenCalled()
    })
  })

  describe("listDrivers", () => {
    it("scopes findMany by schoolId", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.driver.findMany).mockResolvedValue([])
      await listDrivers()
      expect(db.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
      expect(db.driver.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_B }),
        })
      )
    })
  })

  describe("listRoutes", () => {
    it("scopes findMany by schoolId", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.route.findMany).mockResolvedValue([])
      await listRoutes()
      expect(db.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
    })
  })

  describe("listAssignments", () => {
    it("scopes findMany by schoolId", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.routeAssignment.findMany).mockResolvedValue([])
      await listAssignments()
      expect(db.routeAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
    })
  })

  describe("listTrips", () => {
    it("scopes findMany by schoolId", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.trip.findMany).mockResolvedValue([])
      await listTrips()
      expect(db.trip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
    })
  })

  describe("getOverviewStats", () => {
    it("scopes counts by schoolId", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.vehicle.count).mockResolvedValue(0)
      vi.mocked(db.driver.count).mockResolvedValue(0)
      vi.mocked(db.route.count).mockResolvedValue(0)
      vi.mocked(db.routeAssignment.count).mockResolvedValue(0)
      await getOverviewStats()
      expect(db.vehicle.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
      expect(db.driver.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
    })
  })

  describe("getRouteUtilization", () => {
    it("scopes route lookup by schoolId", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.route.findMany).mockResolvedValue([])
      await getRouteUtilization()
      expect(db.route.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
    })
  })

  describe("previewTransportFees", () => {
    it("scopes assignment lookup by schoolId", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.routeAssignment.findMany).mockResolvedValue([])
      await previewTransportFees()
      expect(db.routeAssignment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
    })

    it("rejects non-fee viewers", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "u", role: "TEACHER" },
      } as never)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL_A,
        requestId: null,
        role: "TEACHER",
        isPlatformAdmin: false,
      } as never)
      const result = await previewTransportFees()
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    })
  })

  describe("Trip lifecycle state machine", () => {
    it("startTrip rejects non-SCHEDULED status with TRIP_INVALID_STATE", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.trip.findFirst).mockResolvedValue({
        id: "trip-1",
        status: "IN_PROGRESS",
        routeId: "route-1",
      } as never)
      const result = await startTrip({ id: "trip-1" })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("TRIP_INVALID_STATE")
    })

    it("startTrip looks up trip with schoolId scoping", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.trip.findFirst).mockResolvedValue(null)
      await startTrip({ id: "trip-1" })
      expect(db.trip.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_A }),
        })
      )
    })

    it("startTrip returns TRIP_NOT_FOUND when no trip in scope", async () => {
      mockAdmin(SCHOOL_A)
      vi.mocked(db.trip.findFirst).mockResolvedValue(null)
      const result = await startTrip({ id: "missing" })
      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("TRIP_NOT_FOUND")
    })
  })

  describe("DEVELOPER bypass", () => {
    it("DEVELOPER without schoolId is denied", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "dev-1", role: "DEVELOPER" },
      } as never)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: null,
        role: "DEVELOPER",
        isPlatformAdmin: true,
      } as never)

      const result = await listVehicles()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
    })
  })
})
