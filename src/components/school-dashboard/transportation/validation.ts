// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

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

export const idOnlySchema = z.object({ id: idSchema })
export type IdOnly = z.infer<typeof idOnlySchema>

// ============================================================================
// Server-side raw schemas — the single source of truth for validation.
// Server actions parse with these and return error codes; clients submit plain
// inputs and surface translated messages via error-map.ts
// (resolveTransportationError). Validation is server-only by design.
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
  geofenceId: idSchema.nullable().optional(),
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

// ============================================================================
// Student transport profile (door-to-door pickup point)
// ============================================================================

export const studentTransportProfileSchema = z.object({
  studentId: idSchema,
  pickupAddress: z.string().max(500).optional(),
  pickupLat: z.number().min(-90).max(90).optional(),
  pickupLng: z.number().min(-180).max(180).optional(),
  dropoffAddress: z.string().max(500).optional(),
  dropoffLat: z.number().min(-90).max(90).optional(),
  dropoffLng: z.number().min(-180).max(180).optional(),
  specialNeeds: z.string().max(2000).optional(),
})
export type StudentTransportProfileInput = z.infer<
  typeof studentTransportProfileSchema
>

// Guardian/student "skip pickup" request → an AbsenceIntention(reason=TRANSPORTATION).
export const transportSkipSchema = z.object({
  studentId: idSchema,
  dateFrom: z.coerce.date(),
  dateTo: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
})
export type TransportSkipInput = z.infer<typeof transportSkipSchema>

// Admin review of a pending transport skip.
export const reviewTransportSkipSchema = z.object({
  id: idSchema,
  decision: z.enum(["APPROVED", "REJECTED"]),
})
export type ReviewTransportSkipInput = z.infer<typeof reviewTransportSkipSchema>

// Admin-reported road hazard.
export const roadHazardSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(2000).optional(),
  type: z
    .enum(["road_closure", "accident", "flooding", "construction", "other"])
    .default("other"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(10).max(20000).default(200),
  expiresAt: z.coerce.date().optional(),
})
export type RoadHazardInput = z.infer<typeof roadHazardSchema>

// ============================================================================
// Trip + TripBoarding (M2)
// ============================================================================

export const tripStatusEnum = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
])
export type TripStatus = z.infer<typeof tripStatusEnum>

export const boardingStatusEnum = z.enum([
  "PENDING",
  "BOARDED",
  "ALIGHTED",
  "MISSED",
  "EXCUSED",
])
export type BoardingStatus = z.infer<typeof boardingStatusEnum>

export const tripSchema = z.object({
  routeId: idSchema,
  vehicleId: idSchema.optional(),
  driverId: idSchema.optional(),
  direction: routeDirectionEnum.default("ROUND_TRIP"),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string().regex(timeHHmmRegex),
  notes: z.string().max(2000).optional(),
})

export const tripStartSchema = z.object({ id: idSchema })
export const tripFinishSchema = z.object({
  id: idSchema,
  notes: z.string().max(2000).optional(),
})
export const tripCancelSchema = z.object({
  id: idSchema,
  reason: z.string().max(500).optional(),
})

export const boardingUpsertSchema = z.object({
  tripId: idSchema,
  studentId: idSchema,
  stopId: idSchema,
  status: boardingStatusEnum,
  notes: z.string().max(500).optional(),
})

export type TripServerInput = z.infer<typeof tripSchema>
export type TripStartInput = z.infer<typeof tripStartSchema>
export type TripFinishInput = z.infer<typeof tripFinishSchema>
export type TripCancelInput = z.infer<typeof tripCancelSchema>
export type BoardingUpsertInput = z.infer<typeof boardingUpsertSchema>

// ============================================================================
// Settings (Phase 4.1)
// ============================================================================

export const transportationSettingsSchema = z.object({
  defaultPickupBufferMinutes: z.number().int().min(0).max(240),
  defaultMonthlyFee: z.number().nonnegative().nullable().optional(),
  notifyGuardiansOnTripStart: z.boolean(),
  notifyGuardiansOnTripFinish: z.boolean(),
  notifyGuardiansOnTripCancel: z.boolean(),
  lateThresholdMinutes: z.number().int().min(0).max(240),
  enableRouteOptimization: z.boolean().default(false),
  approachAlertMeters: z.number().int().min(0).max(20000).default(500),
})
export type TransportationSettingsInput = z.infer<
  typeof transportationSettingsSchema
>
