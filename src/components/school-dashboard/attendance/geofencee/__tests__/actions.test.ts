// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createCircularGeofence,
  createPolygonGeofence,
  deleteGeofence,
  getGeofenceEvents,
  getGeofences,
  getLiveStudentLocations,
  submitLocation,
  updateGeofenceStatus,
} from "../actions"

vi.mock("@/lib/db", () => ({
  db: {
    geofence: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    geoFence: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    geofenceEvent: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    geoAttendanceEvent: {
      findMany: vi.fn(),
    },
    studentLocation: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    locationTrace: {
      create: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("../geo-service", () => ({
  getCurrentGeofences: vi.fn().mockResolvedValue([]),
  checkGeofences: vi.fn().mockResolvedValue([]),
  processGeofenceEvents: vi.fn().mockResolvedValue([]),
}))

const SCHOOL = "school-1"

function mockAuth(
  role: string | null = "ADMIN",
  schoolId: string | null = SCHOOL
) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue(
    role ? ({ user: { id: "u1", schoolId, role } } as any) : null
  )
}

describe("geofence actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
  })

  describe("submitLocation", () => {
    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await submitLocation({
        lat: 24.4,
        lng: 54.5,
        accuracy: 10,
      })

      expect(result.success).toBe(false)
    })

    it("denies missing schoolId", async () => {
      mockAuth("STUDENT", null)

      const result = await submitLocation({
        lat: 24.4,
        lng: 54.5,
        accuracy: 10,
      })

      expect(result.success).toBe(false)
    })

    it("denies a non-STUDENT staff role (TEACHER)", async () => {
      mockAuth("TEACHER")

      const result = await submitLocation({
        lat: 24.4,
        lon: 54.5,
        accuracy: 10,
      } as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe(ACTION_ERRORS.UNAUTHORIZED)
      // Role gate must short-circuit before any DB write.
      expect(db.locationTrace.create).not.toHaveBeenCalled()
    })

    it("denies a GUARDIAN role", async () => {
      mockAuth("GUARDIAN")

      const result = await submitLocation({
        lat: 24.4,
        lon: 54.5,
        accuracy: 10,
      } as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe(ACTION_ERRORS.UNAUTHORIZED)
    })

    it("allows a STUDENT with a resolved Student record", async () => {
      mockAuth("STUDENT")
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as any)
      vi.mocked(db.locationTrace.create).mockResolvedValue({} as any)

      const result = await submitLocation({
        lat: 24.4,
        lon: 54.5,
        accuracy: 10,
      } as any)

      expect(result.success).toBe(true)
      expect(db.locationTrace.create).toHaveBeenCalledTimes(1)
    })
  })

  describe("createCircularGeofence", () => {
    const valid = {
      name: "Main Gate",
      lat: 24.4,
      lng: 54.5,
      radius: 50,
      type: "ENTRANCE" as const,
    }

    it("denies non-admin role (TEACHER)", async () => {
      mockAuth("TEACHER")

      const result = await createCircularGeofence(valid)

      expect(result.success).toBe(false)
    })

    it("denies unauthenticated", async () => {
      mockAuth(null)

      const result = await createCircularGeofence(valid)

      expect(result.success).toBe(false)
    })
  })

  describe("createPolygonGeofence", () => {
    it("denies non-admin", async () => {
      mockAuth("TEACHER")

      const result = await createPolygonGeofence({
        name: "Yard",
        coordinates: [
          { lat: 1, lng: 2 },
          { lat: 1.1, lng: 2.1 },
          { lat: 1.2, lng: 2.2 },
        ],
        type: "AREA",
      })

      expect(result.success).toBe(false)
    })
  })

  describe("updateGeofenceStatus", () => {
    it("denies non-admin", async () => {
      mockAuth("STUDENT")

      const result = await updateGeofenceStatus({
        id: "g1",
        isActive: false,
      })

      expect(result.success).toBe(false)
    })
  })

  describe("deleteGeofence", () => {
    it("denies non-admin", async () => {
      mockAuth("TEACHER")

      const result = await deleteGeofence("g1")

      expect(result.success).toBe(false)
    })
  })

  describe("getGeofences", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getGeofences()

      expect(result.success).toBe(false)
    })
  })

  describe("getLiveStudentLocations", () => {
    it("denies non-staff", async () => {
      mockAuth("STUDENT")

      const result = await getLiveStudentLocations({})

      expect(result.success).toBe(false)
    })
  })

  describe("getGeofenceEvents", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getGeofenceEvents({})

      expect(result.success).toBe(false)
    })
  })
})
