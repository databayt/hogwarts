// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  assignStudentToRoute,
  restoreAssignment,
  updateAssignment,
} from "@/components/school-dashboard/transportation/actions/assignments"
import {
  createDriver,
  deleteDriver,
  restoreDriver,
  updateDriver,
} from "@/components/school-dashboard/transportation/actions/drivers"
import {
  createRoute,
  deleteRoute,
  restoreRoute,
  updateRoute,
} from "@/components/school-dashboard/transportation/actions/routes"
import {
  createVehicle,
  deleteVehicle,
  restoreVehicle,
  updateVehicle,
} from "@/components/school-dashboard/transportation/actions/vehicles"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    vehicle: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    driver: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    route: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    routeStop: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    routeAssignment: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
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

// Valid inputs (parse cleanly against the raw server schemas)
const VALID_VEHICLE = {
  plateNumber: "ABC-123",
  make: "Toyota",
  model: "Coaster",
  capacity: 30,
  vehicleType: "BUS",
  status: "ACTIVE",
} as const

const VALID_DRIVER = {
  firstName: "Jane",
  lastName: "Doe",
  phone: "0551234567",
  licenseNumber: "LIC-001",
  licenseExpiry: "2030-01-01T00:00:00.000Z",
  status: "ACTIVE",
} as const

const VALID_ROUTE = {
  name: "North Loop",
  originName: "Depot",
  destinationName: "School",
  departureTime: "07:30",
  direction: "ROUND_TRIP",
  status: "ACTIVE",
} as const

const VALID_ASSIGNMENT = {
  studentId: "stu-1",
  routeId: "route-1",
  stopId: "stop-1",
  direction: "ROUND_TRIP",
  effectiveFrom: "2026-01-01T00:00:00.000Z",
  status: "ACTIVE",
} as const

beforeEach(() => {
  vi.clearAllMocks()
})

// ===========================================================================
// VEHICLES
// ===========================================================================

describe("createVehicle", () => {
  it("happy path: pre-checks plate via findFirst then creates with schoolId in data", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue(null)
    vi.mocked(db.vehicle.create).mockResolvedValue({
      id: "veh-1",
      ...VALID_VEHICLE,
    } as never)

    const result = await createVehicle({ ...VALID_VEHICLE })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toMatchObject({ id: "veh-1" })

    // pre-check is scoped by schoolId + plate + not-deleted
    expect(db.vehicle.findFirst).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        plateNumber: "ABC-123",
        deletedAt: null,
      },
      select: { id: true },
    })
    // create injects the tenant schoolId
    expect(db.vehicle.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL_A,
          plateNumber: "ABC-123",
        }),
      })
    )
  })

  it("returns VEHICLE_PLATE_TAKEN when findFirst finds an existing plate (pre-check, not P2002)", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue({
      id: "veh-existing",
    } as never)

    const result = await createVehicle({ ...VALID_VEHICLE })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VEHICLE_PLATE_TAKEN")
    // create must NOT be attempted once the dupe is detected
    expect(db.vehicle.create).not.toHaveBeenCalled()
  })

  it("returns VEHICLE_CREATE_FAILED when create throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue(null)
    vi.mocked(db.vehicle.create).mockRejectedValue(new Error("db down"))

    const result = await createVehicle({ ...VALID_VEHICLE })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VEHICLE_CREATE_FAILED")
  })

  it("returns VALIDATION_ERROR for bad input without touching the db", async () => {
    mockUser("ADMIN")

    const result = await createVehicle({ ...VALID_VEHICLE, plateNumber: "" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VALIDATION_ERROR")
    expect(db.vehicle.findFirst).not.toHaveBeenCalled()
    expect(db.vehicle.create).not.toHaveBeenCalled()
  })

  it("UNAUTHORIZED for STAFF role (manage_vehicle is ADMIN/DEVELOPER only)", async () => {
    mockUser("STAFF")

    const result = await createVehicle({ ...VALID_VEHICLE })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
    expect(db.vehicle.findFirst).not.toHaveBeenCalled()
    expect(db.vehicle.create).not.toHaveBeenCalled()
  })
})

describe("updateVehicle", () => {
  it("ownership guard: looks up { id, schoolId, deletedAt: null } before updating", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue({
      id: "veh-1",
      plateNumber: "ABC-123",
    } as never)
    vi.mocked(db.vehicle.update).mockResolvedValue({ id: "veh-1" } as never)

    const result = await updateVehicle({ id: "veh-1", capacity: 40 })

    expect(result.success).toBe(true)
    expect(db.vehicle.findFirst).toHaveBeenCalledWith({
      where: { id: "veh-1", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true, plateNumber: true },
    })
    expect(db.vehicle.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "veh-1" } })
    )
  })

  it("returns VEHICLE_NOT_FOUND when the ownership lookup returns null", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue(null)

    const result = await updateVehicle({ id: "veh-x", capacity: 40 })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VEHICLE_NOT_FOUND")
    expect(db.vehicle.update).not.toHaveBeenCalled()
  })

  it("returns VEHICLE_PLATE_TAKEN when changing plate to one used by another vehicle in scope", async () => {
    mockUser("ADMIN")
    // first findFirst = ownership lookup; second = dupe lookup
    vi.mocked(db.vehicle.findFirst)
      .mockResolvedValueOnce({ id: "veh-1", plateNumber: "OLD-1" } as never)
      .mockResolvedValueOnce({ id: "veh-2" } as never)

    const result = await updateVehicle({ id: "veh-1", plateNumber: "NEW-9" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VEHICLE_PLATE_TAKEN")
    // dupe lookup excludes self via NOT and stays schoolId-scoped
    expect(db.vehicle.findFirst).toHaveBeenLastCalledWith({
      where: {
        schoolId: SCHOOL_A,
        plateNumber: "NEW-9",
        deletedAt: null,
        NOT: { id: "veh-1" },
      },
      select: { id: true },
    })
    expect(db.vehicle.update).not.toHaveBeenCalled()
  })
})

describe("deleteVehicle (soft delete)", () => {
  it("scopes the existence lookup and sets deletedAt on update", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue({ id: "veh-1" } as never)
    vi.mocked(db.vehicle.update).mockResolvedValue({ id: "veh-1" } as never)

    const result = await deleteVehicle("veh-1")

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "veh-1" })
    expect(db.vehicle.findFirst).toHaveBeenCalledWith({
      where: { id: "veh-1", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true },
    })
    const updateArg = vi.mocked(db.vehicle.update).mock.calls[0][0] as {
      where: unknown
      data: { deletedAt: Date }
    }
    expect(updateArg.where).toEqual({ id: "veh-1" })
    expect(updateArg.data.deletedAt).toBeInstanceOf(Date)
  })

  it("returns VEHICLE_NOT_FOUND when not in scope (no update)", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue(null)

    const result = await deleteVehicle("veh-x")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VEHICLE_NOT_FOUND")
    expect(db.vehicle.update).not.toHaveBeenCalled()
  })
})

describe("restoreVehicle", () => {
  it("looks up a soft-deleted row then clears deletedAt", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue({ id: "veh-1" } as never)
    vi.mocked(db.vehicle.update).mockResolvedValue({ id: "veh-1" } as never)

    const result = await restoreVehicle("veh-1")

    expect(result.success).toBe(true)
    // restore lookup targets NOT-null deletedAt rows, scoped by schoolId
    expect(db.vehicle.findFirst).toHaveBeenCalledWith({
      where: { id: "veh-1", schoolId: SCHOOL_A, NOT: { deletedAt: null } },
      select: { id: true },
    })
    expect(db.vehicle.update).toHaveBeenCalledWith({
      where: { id: "veh-1" },
      data: { deletedAt: null },
    })
  })

  it("returns VEHICLE_NOT_FOUND when there is no soft-deleted row", async () => {
    mockUser("ADMIN")
    vi.mocked(db.vehicle.findFirst).mockResolvedValue(null)

    const result = await restoreVehicle("veh-x")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("VEHICLE_NOT_FOUND")
    expect(db.vehicle.update).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// DRIVERS
// ===========================================================================

describe("createDriver", () => {
  it("happy path: pre-checks license then creates with schoolId in data", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue(null)
    vi.mocked(db.driver.create).mockResolvedValue({ id: "drv-1" } as never)

    const result = await createDriver({ ...VALID_DRIVER })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toMatchObject({ id: "drv-1" })
    expect(db.driver.findFirst).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_A, licenseNumber: "LIC-001", deletedAt: null },
      select: { id: true },
    })
    expect(db.driver.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL_A,
          licenseNumber: "LIC-001",
          firstName: "Jane",
        }),
      })
    )
  })

  it("returns DRIVER_LICENSE_TAKEN via pre-check findFirst (not P2002)", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue({ id: "drv-dup" } as never)

    const result = await createDriver({ ...VALID_DRIVER })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("DRIVER_LICENSE_TAKEN")
    expect(db.driver.create).not.toHaveBeenCalled()
  })

  it("returns DRIVER_CREATE_FAILED when create throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue(null)
    vi.mocked(db.driver.create).mockRejectedValue(new Error("boom"))

    const result = await createDriver({ ...VALID_DRIVER })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("DRIVER_CREATE_FAILED")
  })
})

describe("updateDriver", () => {
  it("ownership guard before update, scoped { id, schoolId, deletedAt: null }", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue({
      id: "drv-1",
      licenseNumber: "LIC-001",
    } as never)
    vi.mocked(db.driver.update).mockResolvedValue({ id: "drv-1" } as never)

    const result = await updateDriver({ id: "drv-1", firstName: "Mary" })

    expect(result.success).toBe(true)
    expect(db.driver.findFirst).toHaveBeenCalledWith({
      where: { id: "drv-1", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true, licenseNumber: true },
    })
    expect(db.driver.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "drv-1" } })
    )
  })

  it("returns DRIVER_NOT_FOUND when ownership lookup is null", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue(null)

    const result = await updateDriver({ id: "drv-x", firstName: "Mary" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("DRIVER_NOT_FOUND")
    expect(db.driver.update).not.toHaveBeenCalled()
  })

  it("returns DRIVER_LICENSE_TAKEN when new license collides with another driver", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst)
      .mockResolvedValueOnce({ id: "drv-1", licenseNumber: "OLD" } as never)
      .mockResolvedValueOnce({ id: "drv-2" } as never)

    const result = await updateDriver({ id: "drv-1", licenseNumber: "NEW" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("DRIVER_LICENSE_TAKEN")
    expect(db.driver.findFirst).toHaveBeenLastCalledWith({
      where: {
        schoolId: SCHOOL_A,
        licenseNumber: "NEW",
        deletedAt: null,
        NOT: { id: "drv-1" },
      },
      select: { id: true },
    })
    expect(db.driver.update).not.toHaveBeenCalled()
  })
})

describe("deleteDriver (soft delete)", () => {
  it("scopes lookup and soft-deletes", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue({ id: "drv-1" } as never)
    vi.mocked(db.driver.update).mockResolvedValue({ id: "drv-1" } as never)

    const result = await deleteDriver("drv-1")

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "drv-1" })
    expect(db.driver.findFirst).toHaveBeenCalledWith({
      where: { id: "drv-1", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true },
    })
    const updateArg = vi.mocked(db.driver.update).mock.calls[0][0] as {
      data: { deletedAt: Date }
    }
    expect(updateArg.data.deletedAt).toBeInstanceOf(Date)
  })

  it("returns DRIVER_NOT_FOUND when missing", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue(null)

    const result = await deleteDriver("drv-x")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("DRIVER_NOT_FOUND")
    expect(db.driver.update).not.toHaveBeenCalled()
  })
})

describe("restoreDriver", () => {
  it("clears deletedAt for a soft-deleted driver", async () => {
    mockUser("ADMIN")
    // restoreDriver fetches { id, deletedAt } scoped by { id, schoolId }
    vi.mocked(db.driver.findFirst).mockResolvedValue({
      id: "drv-1",
      deletedAt: new Date(),
    } as never)
    vi.mocked(db.driver.update).mockResolvedValue({ id: "drv-1" } as never)

    const result = await restoreDriver("drv-1")

    expect(result.success).toBe(true)
    expect(db.driver.findFirst).toHaveBeenCalledWith({
      where: { id: "drv-1", schoolId: SCHOOL_A },
      select: { id: true, deletedAt: true },
    })
    expect(db.driver.update).toHaveBeenCalledWith({
      where: { id: "drv-1" },
      data: { deletedAt: null },
    })
  })

  it("is a no-op (success, no update) when the driver is not soft-deleted", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue({
      id: "drv-1",
      deletedAt: null,
    } as never)

    const result = await restoreDriver("drv-1")

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "drv-1" })
    expect(db.driver.update).not.toHaveBeenCalled()
  })

  it("returns DRIVER_NOT_FOUND when no row in scope", async () => {
    mockUser("ADMIN")
    vi.mocked(db.driver.findFirst).mockResolvedValue(null)

    const result = await restoreDriver("drv-x")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("DRIVER_NOT_FOUND")
    expect(db.driver.update).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// ROUTES
// ===========================================================================

describe("createRoute", () => {
  it("happy path: pre-checks name then creates with schoolId spread in data", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue(null)
    vi.mocked(db.route.create).mockResolvedValue({ id: "route-1" } as never)

    const result = await createRoute({ ...VALID_ROUTE })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toMatchObject({ id: "route-1" })
    expect(db.route.findFirst).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL_A, name: "North Loop", deletedAt: null },
      select: { id: true },
    })
    expect(db.route.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL_A,
          name: "North Loop",
          originName: "Depot",
        }),
      })
    )
  })

  it("returns ROUTE_NAME_TAKEN via pre-check findFirst (not P2002)", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue({
      id: "route-dup",
    } as never)

    const result = await createRoute({ ...VALID_ROUTE })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NAME_TAKEN")
    expect(db.route.create).not.toHaveBeenCalled()
  })

  it("returns ROUTE_CREATE_FAILED when create throws", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue(null)
    vi.mocked(db.route.create).mockRejectedValue(new Error("boom"))

    const result = await createRoute({ ...VALID_ROUTE })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_CREATE_FAILED")
  })
})

describe("updateRoute", () => {
  it("ownership guard before update, scoped { id, schoolId, deletedAt: null }", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue({
      id: "route-1",
      name: "North Loop",
    } as never)
    vi.mocked(db.route.update).mockResolvedValue({ id: "route-1" } as never)

    const result = await updateRoute({ id: "route-1", status: "INACTIVE" })

    expect(result.success).toBe(true)
    expect(db.route.findFirst).toHaveBeenCalledWith({
      where: { id: "route-1", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true, name: true },
    })
    expect(db.route.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "route-1" } })
    )
  })

  it("returns ROUTE_NOT_FOUND when ownership lookup is null", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue(null)

    const result = await updateRoute({ id: "route-x", status: "INACTIVE" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NOT_FOUND")
    expect(db.route.update).not.toHaveBeenCalled()
  })

  it("returns ROUTE_NAME_TAKEN when renaming to another route's name", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst)
      .mockResolvedValueOnce({ id: "route-1", name: "Old Name" } as never)
      .mockResolvedValueOnce({ id: "route-2" } as never)

    const result = await updateRoute({ id: "route-1", name: "Taken Name" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NAME_TAKEN")
    expect(db.route.findFirst).toHaveBeenLastCalledWith({
      where: {
        schoolId: SCHOOL_A,
        name: "Taken Name",
        deletedAt: null,
        NOT: { id: "route-1" },
      },
      select: { id: true },
    })
    expect(db.route.update).not.toHaveBeenCalled()
  })
})

describe("deleteRoute (soft delete)", () => {
  it("scopes lookup and soft-deletes", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.route.update).mockResolvedValue({ id: "route-1" } as never)

    const result = await deleteRoute("route-1")

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toEqual({ id: "route-1" })
    expect(db.route.findFirst).toHaveBeenCalledWith({
      where: { id: "route-1", schoolId: SCHOOL_A, deletedAt: null },
      select: { id: true },
    })
    const updateArg = vi.mocked(db.route.update).mock.calls[0][0] as {
      data: { deletedAt: Date }
    }
    expect(updateArg.data.deletedAt).toBeInstanceOf(Date)
  })

  it("returns ROUTE_NOT_FOUND when missing", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue(null)

    const result = await deleteRoute("route-x")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NOT_FOUND")
    expect(db.route.update).not.toHaveBeenCalled()
  })
})

describe("restoreRoute", () => {
  it("clears deletedAt for a soft-deleted route", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue({
      id: "route-1",
      deletedAt: new Date(),
    } as never)
    vi.mocked(db.route.update).mockResolvedValue({ id: "route-1" } as never)

    const result = await restoreRoute("route-1")

    expect(result.success).toBe(true)
    expect(db.route.findFirst).toHaveBeenCalledWith({
      where: { id: "route-1", schoolId: SCHOOL_A },
      select: { id: true, deletedAt: true },
    })
    expect(db.route.update).toHaveBeenCalledWith({
      where: { id: "route-1" },
      data: { deletedAt: null },
    })
  })

  it("returns ROUTE_NOT_FOUND when no row in scope", async () => {
    mockUser("ADMIN")
    vi.mocked(db.route.findFirst).mockResolvedValue(null)

    const result = await restoreRoute("route-x")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NOT_FOUND")
    expect(db.route.update).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// ASSIGNMENTS
// ===========================================================================

describe("assignStudentToRoute", () => {
  it("happy path: validates refs, checks active overlap, creates scoped assignment", async () => {
    mockUser("ADMIN")
    // Promise.all order: student, route, stop
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
    } as never)
    // active-overlap pre-check returns nothing
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue(null)
    vi.mocked(db.routeAssignment.create).mockResolvedValue({
      id: "asg-1",
    } as never)

    const result = await assignStudentToRoute({ ...VALID_ASSIGNMENT })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toMatchObject({ id: "asg-1" })

    // overlap check is scoped + ACTIVE + not-deleted
    expect(db.routeAssignment.findFirst).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        studentId: "stu-1",
        routeId: "route-1",
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { id: true },
    })
    expect(db.routeAssignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: SCHOOL_A,
          studentId: "stu-1",
          routeId: "route-1",
          stopId: "stop-1",
        }),
      })
    )
  })

  it("returns ROUTE_ASSIGNMENT_OVERLAP when an active assignment already exists", async () => {
    mockUser("ADMIN")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
    } as never)
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue({
      id: "asg-active",
    } as never)

    const result = await assignStudentToRoute({ ...VALID_ASSIGNMENT })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_ASSIGNMENT_OVERLAP")
    expect(db.routeAssignment.create).not.toHaveBeenCalled()
  })

  it("returns STUDENT_NOT_FOUND when student is not in the school", async () => {
    mockUser("ADMIN")
    vi.mocked(db.student.findFirst).mockResolvedValue(null)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
    } as never)

    const result = await assignStudentToRoute({ ...VALID_ASSIGNMENT })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("STUDENT_NOT_FOUND")
    expect(db.routeAssignment.create).not.toHaveBeenCalled()
    // student lookup is schoolId-scoped
    expect(db.student.findFirst).toHaveBeenCalledWith({
      where: { id: "stu-1", schoolId: SCHOOL_A },
      select: { id: true },
    })
  })

  it("returns ROUTE_NOT_FOUND when the route is missing/deleted", async () => {
    mockUser("ADMIN")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    vi.mocked(db.route.findFirst).mockResolvedValue(null)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
    } as never)

    const result = await assignStudentToRoute({ ...VALID_ASSIGNMENT })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_NOT_FOUND")
    expect(db.routeAssignment.create).not.toHaveBeenCalled()
  })

  it("returns STOP_NOT_FOUND when the stop does not belong to the route", async () => {
    mockUser("ADMIN")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue(null)

    const result = await assignStudentToRoute({ ...VALID_ASSIGNMENT })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("STOP_NOT_FOUND")
    expect(db.routeAssignment.create).not.toHaveBeenCalled()
  })

  it("STAFF is allowed to assign (manage_assignment includes STAFF)", async () => {
    mockUser("STAFF")
    vi.mocked(db.student.findFirst).mockResolvedValue({ id: "stu-1" } as never)
    vi.mocked(db.route.findFirst).mockResolvedValue({ id: "route-1" } as never)
    vi.mocked(db.routeStop.findFirst).mockResolvedValue({
      id: "stop-1",
    } as never)
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue(null)
    vi.mocked(db.routeAssignment.create).mockResolvedValue({
      id: "asg-1",
    } as never)

    const result = await assignStudentToRoute({ ...VALID_ASSIGNMENT })

    expect(result.success).toBe(true)
    expect(db.routeAssignment.create).toHaveBeenCalled()
  })
})

describe("updateAssignment", () => {
  it("ownership guard before update; returns ROUTE_ASSIGNMENT_NOT_FOUND when null", async () => {
    mockUser("ADMIN")
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue(null)

    const result = await updateAssignment({ id: "asg-x", status: "PAUSED" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_ASSIGNMENT_NOT_FOUND")
    expect(db.routeAssignment.findFirst).toHaveBeenCalledWith({
      where: { id: "asg-x", schoolId: SCHOOL_A, deletedAt: null },
      // studentId is selected so re-activation can run the active-conflict guard.
      select: { id: true, routeId: true, studentId: true },
    })
    expect(db.routeAssignment.update).not.toHaveBeenCalled()
  })

  it("updates an in-scope assignment", async () => {
    mockUser("ADMIN")
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue({
      id: "asg-1",
      routeId: "route-1",
    } as never)
    vi.mocked(db.routeAssignment.update).mockResolvedValue({
      id: "asg-1",
      status: "PAUSED",
    } as never)

    const result = await updateAssignment({ id: "asg-1", status: "PAUSED" })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toMatchObject({ status: "PAUSED" })
    expect(db.routeAssignment.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "asg-1" } })
    )
  })
})

describe("restoreAssignment", () => {
  it("blocks restore with ROUTE_ASSIGNMENT_OVERLAP when an active dupe exists", async () => {
    mockUser("ADMIN")
    // first findFirst = the soft-deleted row being restored
    vi.mocked(db.routeAssignment.findFirst)
      .mockResolvedValueOnce({
        id: "asg-1",
        deletedAt: new Date(),
        studentId: "stu-1",
        routeId: "route-1",
      } as never)
      // second findFirst = conflict lookup
      .mockResolvedValueOnce({ id: "asg-active" } as never)

    const result = await restoreAssignment("asg-1")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_ASSIGNMENT_OVERLAP")
    // conflict lookup is scoped, ACTIVE, not-deleted, and excludes self
    expect(db.routeAssignment.findFirst).toHaveBeenLastCalledWith({
      where: {
        schoolId: SCHOOL_A,
        studentId: "stu-1",
        routeId: "route-1",
        status: "ACTIVE",
        deletedAt: null,
        NOT: { id: "asg-1" },
      },
      select: { id: true },
    })
    expect(db.routeAssignment.update).not.toHaveBeenCalled()
  })

  it("clears deletedAt when no conflict exists", async () => {
    mockUser("ADMIN")
    vi.mocked(db.routeAssignment.findFirst)
      .mockResolvedValueOnce({
        id: "asg-1",
        deletedAt: new Date(),
        studentId: "stu-1",
        routeId: "route-1",
      } as never)
      .mockResolvedValueOnce(null)
    vi.mocked(db.routeAssignment.update).mockResolvedValue({
      id: "asg-1",
    } as never)

    const result = await restoreAssignment("asg-1")

    expect(result.success).toBe(true)
    expect(db.routeAssignment.update).toHaveBeenCalledWith({
      where: { id: "asg-1" },
      data: { deletedAt: null },
    })
  })

  it("returns ROUTE_ASSIGNMENT_NOT_FOUND when row missing", async () => {
    mockUser("ADMIN")
    vi.mocked(db.routeAssignment.findFirst).mockResolvedValue(null)

    const result = await restoreAssignment("asg-x")

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBe("ROUTE_ASSIGNMENT_NOT_FOUND")
    expect(db.routeAssignment.update).not.toHaveBeenCalled()
  })
})
