// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  Driver,
  Route,
  RouteAssignment,
  RouteStop,
  StaffMember,
  Student,
  Vehicle,
} from "@prisma/client"

// ============================================================================
// Enriched row shapes used by tables/forms
// ============================================================================

export type VehicleRow = Vehicle

export type DriverRow = Driver & {
  staffMember: Pick<StaffMember, "id" | "firstName" | "lastName"> | null
}

export type RouteRow = Route & {
  vehicle: Pick<Vehicle, "id" | "plateNumber"> | null
  driver: Pick<Driver, "id" | "firstName" | "lastName"> | null
  _count: {
    stops: number
    assignments: number
  }
}

export type RouteStopRow = RouteStop

export type RouteAssignmentRow = RouteAssignment & {
  student: Pick<Student, "id" | "firstName" | "lastName"> | null
  route: Pick<Route, "id" | "name" | "code"> | null
  stop: Pick<RouteStop, "id" | "name" | "stopOrder"> | null
}

// ============================================================================
// Action result helpers
// ============================================================================

export type TransportationActionError =
  | "NOT_AUTHENTICATED"
  | "MISSING_SCHOOL_CONTEXT"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "PLATE_ALREADY_EXISTS"
  | "LICENSE_ALREADY_EXISTS"
  | "ROUTE_NAME_TAKEN"
  | "STOP_ORDER_CONFLICT"
  | "ASSIGNMENT_OVERLAP"
  | "INVALID_DATE_RANGE"
  | "INTERNAL_ERROR"

export type ActionResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; errorCode?: TransportationActionError }
