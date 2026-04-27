// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Enums (mirror Prisma enums)
// ============================================================================

export const vehicleStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "MAINTENANCE",
  "RETIRED",
])
export type VehicleStatus = z.infer<typeof vehicleStatusEnum>

export const vehicleTypeEnum = z.enum(["BUS", "VAN", "CAR", "MINIBUS"])
export type VehicleType = z.infer<typeof vehicleTypeEnum>

export const routeStatusEnum = z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"])
export type RouteStatus = z.infer<typeof routeStatusEnum>

export const routeDirectionEnum = z.enum(["PICKUP", "DROPOFF", "ROUND_TRIP"])
export type RouteDirection = z.infer<typeof routeDirectionEnum>

export const assignmentStatusEnum = z.enum(["ACTIVE", "PAUSED", "ENDED"])
export type AssignmentStatus = z.infer<typeof assignmentStatusEnum>

export const driverStatusEnum = z.enum(["ACTIVE", "ON_LEAVE", "INACTIVE"])
export type DriverStatus = z.infer<typeof driverStatusEnum>

// ============================================================================
// Shared shapes
// ============================================================================

const timeHHmmRegex = /^([01]\d|2[0-3]):[0-5]\d$/
const idSchema = z.string().min(1)

// ============================================================================
// Schema factories (i18n-aware via ValidationHelper)
// ============================================================================

export function createVehicleSchema(v: ValidationHelper) {
  return z.object({
    plateNumber: z.string().min(1, v.required()).max(32, v.maxLength(32)),
    make: z.string().max(64, v.maxLength(64)).optional(),
    model: z.string().max(64, v.maxLength(64)).optional(),
    year: z
      .number()
      .int()
      .min(1980, v.min(1980))
      .max(new Date().getFullYear() + 1)
      .optional(),
    capacity: z.number().int().min(1, v.positive()).max(120, v.max(120)),
    vehicleType: vehicleTypeEnum.default("BUS"),
    status: vehicleStatusEnum.default("ACTIVE"),
    registrationExpiry: z.string().datetime().optional(),
    insuranceExpiry: z.string().datetime().optional(),
    lastInspection: z.string().datetime().optional(),
    notes: z.string().max(2000, v.maxLength(2000)).optional(),
  })
}
export type VehicleInput = z.infer<ReturnType<typeof createVehicleSchema>>

export function createDriverSchema(v: ValidationHelper) {
  return z.object({
    firstName: z.string().min(1, v.required()).max(64, v.maxLength(64)),
    lastName: z.string().min(1, v.required()).max(64, v.maxLength(64)),
    phone: z.string().min(6, v.minLength(6)).max(32, v.maxLength(32)),
    email: z.string().email(v.email()).optional().or(z.literal("")),
    address: z.string().max(255, v.maxLength(255)).optional(),
    licenseNumber: z.string().min(1, v.required()).max(64, v.maxLength(64)),
    licenseClass: z.string().max(16, v.maxLength(16)).optional(),
    licenseExpiry: z.string().datetime(),
    status: driverStatusEnum.default("ACTIVE"),
    dateOfBirth: z.string().datetime().optional(),
    emergencyContactName: z.string().max(128, v.maxLength(128)).optional(),
    emergencyContactPhone: z.string().max(32, v.maxLength(32)).optional(),
    notes: z.string().max(2000, v.maxLength(2000)).optional(),
    staffMemberId: idSchema.optional(),
    userId: idSchema.optional(),
  })
}
export type DriverInput = z.infer<ReturnType<typeof createDriverSchema>>

export function createRouteSchema(v: ValidationHelper) {
  return z.object({
    name: z.string().min(1, v.required()).max(128, v.maxLength(128)),
    code: z.string().max(32, v.maxLength(32)).optional(),
    direction: routeDirectionEnum.default("ROUND_TRIP"),
    status: routeStatusEnum.default("ACTIVE"),
    originName: z.string().min(1, v.required()).max(255, v.maxLength(255)),
    destinationName: z.string().min(1, v.required()).max(255, v.maxLength(255)),
    departureTime: z.string().regex(timeHHmmRegex),
    returnTime: z.string().regex(timeHHmmRegex).optional(),
    distanceKm: z.number().nonnegative(v.positive()).optional(),
    monthlyFee: z.number().nonnegative(v.positive()).optional(),
    notes: z.string().max(2000, v.maxLength(2000)).optional(),
    vehicleId: idSchema.optional(),
    driverId: idSchema.optional(),
  })
}
export type RouteInput = z.infer<ReturnType<typeof createRouteSchema>>

export function createRouteStopSchema(v: ValidationHelper) {
  return z.object({
    routeId: idSchema,
    name: z.string().min(1, v.required()).max(128, v.maxLength(128)),
    address: z.string().max(255, v.maxLength(255)).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    stopOrder: z.number().int().min(1, v.positive()),
    pickupTime: z.string().regex(timeHHmmRegex).optional(),
    dropoffTime: z.string().regex(timeHHmmRegex).optional(),
    notes: z.string().max(2000, v.maxLength(2000)).optional(),
  })
}
export type RouteStopInput = z.infer<ReturnType<typeof createRouteStopSchema>>

export function createReorderStopsSchema(_v: ValidationHelper) {
  return z.object({
    routeId: idSchema,
    stopIds: z.array(idSchema).min(1),
  })
}
export type ReorderStopsInput = z.infer<
  ReturnType<typeof createReorderStopsSchema>
>

export function createRouteAssignmentSchema(v: ValidationHelper) {
  return z
    .object({
      studentId: idSchema,
      routeId: idSchema,
      stopId: idSchema,
      direction: routeDirectionEnum.default("ROUND_TRIP"),
      effectiveFrom: z.string().datetime(),
      effectiveTo: z.string().datetime().optional(),
      status: assignmentStatusEnum.default("ACTIVE"),
      notes: z.string().max(2000, v.maxLength(2000)).optional(),
    })
    .refine(
      (input) =>
        !input.effectiveTo ||
        new Date(input.effectiveTo) > new Date(input.effectiveFrom),
      { path: ["effectiveTo"], message: "DATE_RANGE_INVALID" }
    )
}
export type RouteAssignmentInput = z.infer<
  ReturnType<typeof createRouteAssignmentSchema>
>

// ============================================================================
// Update wrappers (id + partial fields)
// ============================================================================

export const idOnlySchema = z.object({ id: idSchema })
export type IdOnly = z.infer<typeof idOnlySchema>

export function createVehicleUpdateSchema(v: ValidationHelper) {
  return createVehicleSchema(v).partial().extend({ id: idSchema })
}

export function createDriverUpdateSchema(v: ValidationHelper) {
  return createDriverSchema(v).partial().extend({ id: idSchema })
}

export function createRouteUpdateSchema(v: ValidationHelper) {
  return createRouteSchema(v).partial().extend({ id: idSchema })
}

export function createRouteStopUpdateSchema(v: ValidationHelper) {
  return createRouteStopSchema(v).partial().extend({ id: idSchema })
}

export function createRouteAssignmentUpdateSchema(v: ValidationHelper) {
  return z.object({
    id: idSchema,
    stopId: idSchema.optional(),
    direction: routeDirectionEnum.optional(),
    effectiveTo: z.string().datetime().optional(),
    status: assignmentStatusEnum.optional(),
    notes: z.string().max(2000, v.maxLength(2000)).optional(),
  })
}

// ============================================================================
// Server-side raw schemas (no i18n — error codes only)
// Server actions parse with these; clients use the factory schemas above
// for inline validation with translated messages.
// ============================================================================

export const vehicleSchema = z.object({
  plateNumber: z.string().min(1).max(32),
  make: z.string().max(64).optional(),
  model: z.string().max(64).optional(),
  year: z
    .number()
    .int()
    .min(1980)
    .max(new Date().getFullYear() + 1)
    .optional(),
  capacity: z.number().int().min(1).max(120),
  vehicleType: vehicleTypeEnum.default("BUS"),
  status: vehicleStatusEnum.default("ACTIVE"),
  registrationExpiry: z.string().datetime().optional(),
  insuranceExpiry: z.string().datetime().optional(),
  lastInspection: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
})

export const vehicleUpdateSchema = vehicleSchema
  .partial()
  .extend({ id: idSchema })

export const driverSchema = z.object({
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  phone: z.string().min(6).max(32),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(255).optional(),
  licenseNumber: z.string().min(1).max(64),
  licenseClass: z.string().max(16).optional(),
  licenseExpiry: z.string().datetime(),
  status: driverStatusEnum.default("ACTIVE"),
  dateOfBirth: z.string().datetime().optional(),
  emergencyContactName: z.string().max(128).optional(),
  emergencyContactPhone: z.string().max(32).optional(),
  notes: z.string().max(2000).optional(),
  staffMemberId: idSchema.optional(),
  userId: idSchema.optional(),
})

export const driverUpdateSchema = driverSchema
  .partial()
  .extend({ id: idSchema })

export const routeSchema = z.object({
  name: z.string().min(1).max(128),
  code: z.string().max(32).optional(),
  direction: routeDirectionEnum.default("ROUND_TRIP"),
  status: routeStatusEnum.default("ACTIVE"),
  originName: z.string().min(1).max(255),
  destinationName: z.string().min(1).max(255),
  departureTime: z.string().regex(timeHHmmRegex),
  returnTime: z.string().regex(timeHHmmRegex).optional(),
  distanceKm: z.number().nonnegative().optional(),
  monthlyFee: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
  vehicleId: idSchema.optional(),
  driverId: idSchema.optional(),
})

export const routeUpdateSchema = routeSchema.partial().extend({ id: idSchema })

export const routeStopSchema = z.object({
  routeId: idSchema,
  name: z.string().min(1).max(128),
  address: z.string().max(255).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  stopOrder: z.number().int().min(1),
  pickupTime: z.string().regex(timeHHmmRegex).optional(),
  dropoffTime: z.string().regex(timeHHmmRegex).optional(),
  notes: z.string().max(2000).optional(),
})

export const routeStopUpdateSchema = routeStopSchema
  .partial()
  .extend({ id: idSchema })

export const reorderStopsSchema = z.object({
  routeId: idSchema,
  stopIds: z.array(idSchema).min(1),
})

export const routeAssignmentSchema = z
  .object({
    studentId: idSchema,
    routeId: idSchema,
    stopId: idSchema,
    direction: routeDirectionEnum.default("ROUND_TRIP"),
    effectiveFrom: z.string().datetime(),
    effectiveTo: z.string().datetime().optional(),
    status: assignmentStatusEnum.default("ACTIVE"),
    notes: z.string().max(2000).optional(),
  })
  .refine(
    (input) =>
      !input.effectiveTo ||
      new Date(input.effectiveTo) > new Date(input.effectiveFrom),
    { path: ["effectiveTo"], message: "DATE_RANGE_INVALID" }
  )

export const routeAssignmentUpdateSchema = z.object({
  id: idSchema,
  stopId: idSchema.optional(),
  direction: routeDirectionEnum.optional(),
  effectiveTo: z.string().datetime().optional(),
  status: assignmentStatusEnum.optional(),
  notes: z.string().max(2000).optional(),
})

export const endAssignmentSchema = z.object({
  id: idSchema,
  endDate: z.string().datetime().optional(),
})

export type VehicleServerInput = z.infer<typeof vehicleSchema>
export type VehicleUpdateInput = z.infer<typeof vehicleUpdateSchema>
export type DriverServerInput = z.infer<typeof driverSchema>
export type DriverUpdateInput = z.infer<typeof driverUpdateSchema>
export type RouteServerInput = z.infer<typeof routeSchema>
export type RouteUpdateInput = z.infer<typeof routeUpdateSchema>
export type RouteStopServerInput = z.infer<typeof routeStopSchema>
export type RouteStopUpdateInput = z.infer<typeof routeStopUpdateSchema>
export type ReorderStopsServerInput = z.infer<typeof reorderStopsSchema>
export type RouteAssignmentServerInput = z.infer<typeof routeAssignmentSchema>
export type RouteAssignmentUpdateInput = z.infer<
  typeof routeAssignmentUpdateSchema
>
export type EndAssignmentInput = z.infer<typeof endAssignmentSchema>
