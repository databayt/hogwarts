// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  driverSchema,
  reorderStopsSchema,
  routeAssignmentSchema,
  routeSchema,
  routeStopSchema,
  vehicleSchema,
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
