// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  boardingUpsertSchema,
  driverSchema,
  driverUpdateSchema,
  endAssignmentSchema,
  idOnlySchema,
  reorderStopsSchema,
  routeAssignmentSchema,
  routeAssignmentUpdateSchema,
  routeSchema,
  routeStopSchema,
  routeStopUpdateSchema,
  routeUpdateSchema,
  transportationSettingsSchema,
  tripCancelSchema,
  tripFinishSchema,
  tripSchema,
  tripStartSchema,
  vehicleSchema,
  vehicleUpdateSchema,
} from "../validation"

const FUTURE_DATE = new Date(
  Date.now() + 1000 * 60 * 60 * 24 * 365
).toISOString()
const PAST_DATE = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()

describe("vehicleSchema", () => {
  it("accepts a minimal valid vehicle", () => {
    const result = vehicleSchema.safeParse({
      plateNumber: "ABC-123",
      capacity: 30,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.vehicleType).toBe("BUS")
      expect(result.data.status).toBe("ACTIVE")
    }
  })

  it("rejects empty plateNumber", () => {
    const result = vehicleSchema.safeParse({ plateNumber: "", capacity: 30 })
    expect(result.success).toBe(false)
  })

  it("rejects capacity < 1", () => {
    const result = vehicleSchema.safeParse({
      plateNumber: "X1",
      capacity: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects capacity > 120", () => {
    const result = vehicleSchema.safeParse({
      plateNumber: "X1",
      capacity: 200,
    })
    expect(result.success).toBe(false)
  })

  it("rejects unknown vehicleType", () => {
    const result = vehicleSchema.safeParse({
      plateNumber: "X1",
      capacity: 30,
      vehicleType: "TRUCK",
    })
    expect(result.success).toBe(false)
  })
})

describe("driverSchema", () => {
  it("accepts a minimal valid driver", () => {
    const result = driverSchema.safeParse({
      firstName: "Ali",
      lastName: "Hassan",
      phone: "+249912345678",
      licenseNumber: "DL-9876",
      licenseExpiry: FUTURE_DATE,
    })
    expect(result.success).toBe(true)
  })

  it("rejects when phone is too short", () => {
    const result = driverSchema.safeParse({
      firstName: "A",
      lastName: "B",
      phone: "12",
      licenseNumber: "DL-1",
      licenseExpiry: FUTURE_DATE,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const result = driverSchema.safeParse({
      firstName: "A",
      lastName: "B",
      phone: "+249912345678",
      email: "not-an-email",
      licenseNumber: "DL-1",
      licenseExpiry: FUTURE_DATE,
    })
    expect(result.success).toBe(false)
  })

  it("accepts empty email string (treated as null)", () => {
    const result = driverSchema.safeParse({
      firstName: "A",
      lastName: "B",
      phone: "+249912345678",
      email: "",
      licenseNumber: "DL-1",
      licenseExpiry: FUTURE_DATE,
    })
    expect(result.success).toBe(true)
  })
})

describe("routeSchema", () => {
  it("accepts a minimal valid route", () => {
    const result = routeSchema.safeParse({
      name: "Khartoum North",
      originName: "Khartoum",
      destinationName: "School",
      departureTime: "07:30",
    })
    expect(result.success).toBe(true)
  })

  it("rejects invalid time format", () => {
    const result = routeSchema.safeParse({
      name: "X",
      originName: "A",
      destinationName: "B",
      departureTime: "25:99",
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative monthlyFee", () => {
    const result = routeSchema.safeParse({
      name: "X",
      originName: "A",
      destinationName: "B",
      departureTime: "07:00",
      monthlyFee: -50,
    })
    expect(result.success).toBe(false)
  })
})

describe("routeStopSchema", () => {
  it("accepts a valid stop", () => {
    const result = routeStopSchema.safeParse({
      routeId: "route-1",
      name: "Stop 1",
      stopOrder: 1,
    })
    expect(result.success).toBe(true)
  })

  it("rejects stopOrder < 1", () => {
    const result = routeStopSchema.safeParse({
      routeId: "route-1",
      name: "Stop",
      stopOrder: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects out-of-range latitude", () => {
    const result = routeStopSchema.safeParse({
      routeId: "route-1",
      name: "Stop",
      stopOrder: 1,
      latitude: 91,
    })
    expect(result.success).toBe(false)
  })
})

describe("routeAssignmentSchema", () => {
  it("accepts a minimal valid assignment", () => {
    const result = routeAssignmentSchema.safeParse({
      studentId: "s-1",
      routeId: "r-1",
      stopId: "st-1",
      effectiveFrom: FUTURE_DATE,
    })
    expect(result.success).toBe(true)
  })

  it("rejects when effectiveTo <= effectiveFrom", () => {
    const result = routeAssignmentSchema.safeParse({
      studentId: "s-1",
      routeId: "r-1",
      stopId: "st-1",
      effectiveFrom: FUTURE_DATE,
      effectiveTo: PAST_DATE,
    })
    expect(result.success).toBe(false)
  })

  it("accepts when effectiveTo > effectiveFrom", () => {
    const earlier = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString()
    const later = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString()
    const result = routeAssignmentSchema.safeParse({
      studentId: "s-1",
      routeId: "r-1",
      stopId: "st-1",
      effectiveFrom: earlier,
      effectiveTo: later,
    })
    expect(result.success).toBe(true)
  })
})

describe("reorderStopsSchema", () => {
  it("requires at least one stop ID", () => {
    const result = reorderStopsSchema.safeParse({
      routeId: "r-1",
      stopIds: [],
    })
    expect(result.success).toBe(false)
  })

  it("accepts an array of stop IDs", () => {
    const result = reorderStopsSchema.safeParse({
      routeId: "r-1",
      stopIds: ["s-1", "s-2", "s-3"],
    })
    expect(result.success).toBe(true)
  })
})

// ============================================================================
// Backfill: previously-untested raw schemas
// ============================================================================

describe("idOnlySchema", () => {
  it("accepts a non-empty id", () => {
    const result = idOnlySchema.safeParse({ id: "veh-1" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe("veh-1")
    }
  })

  it("rejects an empty id", () => {
    const result = idOnlySchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })

  it("rejects a missing id", () => {
    const result = idOnlySchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("vehicleUpdateSchema", () => {
  it("accepts id-only (all other fields optional)", () => {
    const result = vehicleUpdateSchema.safeParse({ id: "veh-1" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe("veh-1")
      // partial() strips the defaults, so plateNumber/capacity stay undefined
      expect(result.data.plateNumber).toBeUndefined()
    }
  })

  it("rejects when id is missing", () => {
    const result = vehicleUpdateSchema.safeParse({ capacity: 30 })
    expect(result.success).toBe(false)
  })

  it("rejects out-of-range capacity even on partial update", () => {
    const result = vehicleUpdateSchema.safeParse({ id: "veh-1", capacity: 999 })
    expect(result.success).toBe(false)
  })
})

describe("driverUpdateSchema", () => {
  it("accepts id plus a single partial field", () => {
    const result = driverUpdateSchema.safeParse({
      id: "drv-1",
      firstName: "Sara",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe("drv-1")
      expect(result.data.firstName).toBe("Sara")
    }
  })

  it("rejects an invalid email on a partial update", () => {
    const result = driverUpdateSchema.safeParse({
      id: "drv-1",
      email: "not-an-email",
    })
    expect(result.success).toBe(false)
  })
})

describe("routeUpdateSchema", () => {
  it("accepts id plus a valid departureTime", () => {
    const result = routeUpdateSchema.safeParse({
      id: "route-1",
      departureTime: "08:15",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.departureTime).toBe("08:15")
    }
  })

  it("rejects a bad time regex on a partial update", () => {
    const result = routeUpdateSchema.safeParse({
      id: "route-1",
      departureTime: "8:5",
    })
    expect(result.success).toBe(false)
  })
})

describe("routeStopUpdateSchema", () => {
  it("accepts id plus a valid stopOrder", () => {
    const result = routeStopUpdateSchema.safeParse({
      id: "stop-1",
      stopOrder: 3,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stopOrder).toBe(3)
    }
  })

  it("rejects out-of-range latitude on a partial update", () => {
    const result = routeStopUpdateSchema.safeParse({
      id: "stop-1",
      latitude: -91,
    })
    expect(result.success).toBe(false)
  })
})

describe("routeAssignmentUpdateSchema", () => {
  it("accepts id-only", () => {
    const result = routeAssignmentUpdateSchema.safeParse({ id: "ra-1" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe("ra-1")
    }
  })

  it("accepts id plus a valid status and stopId", () => {
    const result = routeAssignmentUpdateSchema.safeParse({
      id: "ra-1",
      status: "PAUSED",
      stopId: "st-9",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe("PAUSED")
    }
  })

  it("rejects an unknown status enum value", () => {
    const result = routeAssignmentUpdateSchema.safeParse({
      id: "ra-1",
      status: "SUSPENDED",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a non-datetime effectiveTo", () => {
    const result = routeAssignmentUpdateSchema.safeParse({
      id: "ra-1",
      effectiveTo: "2026-05-29",
    })
    expect(result.success).toBe(false)
  })
})

describe("endAssignmentSchema", () => {
  it("accepts id-only (endDate optional)", () => {
    const result = endAssignmentSchema.safeParse({ id: "ra-1" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.endDate).toBeUndefined()
    }
  })

  it("accepts id plus a valid datetime endDate", () => {
    const result = endAssignmentSchema.safeParse({
      id: "ra-1",
      endDate: FUTURE_DATE,
    })
    expect(result.success).toBe(true)
  })

  it("rejects a non-datetime endDate", () => {
    const result = endAssignmentSchema.safeParse({
      id: "ra-1",
      endDate: "tomorrow",
    })
    expect(result.success).toBe(false)
  })
})

describe("tripSchema", () => {
  it("accepts a minimal valid trip", () => {
    const result = tripSchema.safeParse({
      routeId: "route-1",
      scheduledDate: FUTURE_DATE,
      scheduledTime: "07:30",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.direction).toBe("ROUND_TRIP")
      expect(result.data.routeId).toBe("route-1")
    }
  })

  it("rejects a bad scheduledTime regex", () => {
    const result = tripSchema.safeParse({
      routeId: "route-1",
      scheduledDate: FUTURE_DATE,
      scheduledTime: "7:5",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a non-datetime scheduledDate", () => {
    const result = tripSchema.safeParse({
      routeId: "route-1",
      scheduledDate: "2026-05-29",
      scheduledTime: "07:30",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a missing routeId", () => {
    const result = tripSchema.safeParse({
      scheduledDate: FUTURE_DATE,
      scheduledTime: "07:30",
    })
    expect(result.success).toBe(false)
  })
})

describe("tripStartSchema", () => {
  it("accepts a non-empty id", () => {
    const result = tripStartSchema.safeParse({ id: "trip-1" })
    expect(result.success).toBe(true)
  })

  it("rejects an empty id", () => {
    const result = tripStartSchema.safeParse({ id: "" })
    expect(result.success).toBe(false)
  })
})

describe("tripFinishSchema", () => {
  it("accepts id plus optional notes", () => {
    const result = tripFinishSchema.safeParse({
      id: "trip-1",
      notes: "all dropped off",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notes).toBe("all dropped off")
    }
  })

  it("rejects notes longer than 2000 chars", () => {
    const result = tripFinishSchema.safeParse({
      id: "trip-1",
      notes: "x".repeat(2001),
    })
    expect(result.success).toBe(false)
  })
})

describe("tripCancelSchema", () => {
  it("accepts id plus optional reason", () => {
    const result = tripCancelSchema.safeParse({
      id: "trip-1",
      reason: "vehicle breakdown",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.reason).toBe("vehicle breakdown")
    }
  })

  it("rejects reason longer than 500 chars", () => {
    const result = tripCancelSchema.safeParse({
      id: "trip-1",
      reason: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe("boardingUpsertSchema", () => {
  it("accepts a valid boarding upsert", () => {
    const result = boardingUpsertSchema.safeParse({
      tripId: "trip-1",
      studentId: "stu-1",
      stopId: "stop-1",
      status: "BOARDED",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe("BOARDED")
    }
  })

  it("rejects an unknown boarding status", () => {
    const result = boardingUpsertSchema.safeParse({
      tripId: "trip-1",
      studentId: "stu-1",
      stopId: "stop-1",
      status: "WAITING",
    })
    expect(result.success).toBe(false)
  })

  it("rejects when status is missing (it is required)", () => {
    const result = boardingUpsertSchema.safeParse({
      tripId: "trip-1",
      studentId: "stu-1",
      stopId: "stop-1",
    })
    expect(result.success).toBe(false)
  })
})

describe("transportationSettingsSchema", () => {
  it("accepts a fully valid settings payload", () => {
    const result = transportationSettingsSchema.safeParse({
      defaultPickupBufferMinutes: 10,
      defaultMonthlyFee: 250,
      notifyGuardiansOnTripStart: true,
      notifyGuardiansOnTripFinish: false,
      notifyGuardiansOnTripCancel: true,
      lateThresholdMinutes: 15,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.defaultMonthlyFee).toBe(250)
    }
  })

  it("accepts a null defaultMonthlyFee", () => {
    const result = transportationSettingsSchema.safeParse({
      defaultPickupBufferMinutes: 0,
      defaultMonthlyFee: null,
      notifyGuardiansOnTripStart: false,
      notifyGuardiansOnTripFinish: false,
      notifyGuardiansOnTripCancel: false,
      lateThresholdMinutes: 0,
    })
    expect(result.success).toBe(true)
  })

  it("rejects defaultPickupBufferMinutes above 240", () => {
    const result = transportationSettingsSchema.safeParse({
      defaultPickupBufferMinutes: 241,
      notifyGuardiansOnTripStart: true,
      notifyGuardiansOnTripFinish: true,
      notifyGuardiansOnTripCancel: true,
      lateThresholdMinutes: 15,
    })
    expect(result.success).toBe(false)
  })

  it("rejects a missing boolean notify flag", () => {
    const result = transportationSettingsSchema.safeParse({
      defaultPickupBufferMinutes: 10,
      notifyGuardiansOnTripStart: true,
      notifyGuardiansOnTripFinish: true,
      // notifyGuardiansOnTripCancel missing
      lateThresholdMinutes: 15,
    })
    expect(result.success).toBe(false)
  })
})
