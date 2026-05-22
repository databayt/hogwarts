// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Maps server ActionResponse error codes to translated, user-facing messages.
// Server actions return machine codes (e.g. "VEHICLE_PLATE_TAKEN"); clients
// route `result.error` through this so the user sees a specific localized
// message instead of a generic "something went wrong".

import type { Dictionary } from "@/components/internationalization/dictionaries"

type TransportationDict = Dictionary["transportation"]

export function resolveTransportationError(
  t: TransportationDict,
  code: string | undefined | null
): string {
  const e = t.errors
  switch (code) {
    case "VEHICLE_PLATE_TAKEN":
      return e.plateAlreadyExists
    case "DRIVER_LICENSE_TAKEN":
      return e.licenseAlreadyExists
    case "ROUTE_NAME_TAKEN":
      return e.routeNameTaken
    case "STOP_ORDER_CONFLICT":
      return e.stopOrderConflict
    case "ROUTE_ASSIGNMENT_OVERLAP":
      return e.assignmentOverlap
    case "HAS_DEPENDENCIES":
      return e.hasDependencies
    case "VEHICLE_NOT_FOUND":
    case "DRIVER_NOT_FOUND":
    case "ROUTE_NOT_FOUND":
    case "STUDENT_NOT_FOUND":
    case "STOP_NOT_FOUND":
    case "ROUTE_ASSIGNMENT_NOT_FOUND":
    case "TRIP_NOT_FOUND":
      return e.notFound
    case "UNAUTHORIZED":
    case "NOT_AUTHENTICATED":
    case "MISSING_SCHOOL":
      return e.forbidden
    case "VALIDATION_ERROR":
      return e.validationFailed
    case "TRIP_DUPLICATE":
      return t.trips.errors.duplicate
    case "TRIP_INVALID_STATE":
      return t.trips.errors.invalidState
    default:
      return e.internalError
  }
}
