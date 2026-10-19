// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Dictionary } from "@/components/internationalization/dictionaries"

type AdmissionDict = Dictionary["school"]["admission"]

/**
 * Dict-first mapping for admission action error CODES (see ACTION_ERRORS in
 * src/lib/action-errors.ts) — a raw code like "SECTION_AT_CAPACITY" must never
 * reach the toast. An unmapped code falls back to `fallback` (the caller's own
 * "update failed" line) and then to the generic message.
 */
export function resolveAdmissionErrorMessage(
  code: string | undefined,
  dictionary: AdmissionDict | undefined,
  fallback?: string
): string {
  const e = dictionary?.errors
  switch (code) {
    case "FORBIDDEN":
      return e?.forbidden || "You don't have permission to do this."
    case "SECTION_AT_CAPACITY":
      return (
        e?.sectionAtCapacity || "This section is full. Choose another section."
      )
    case "VALIDATION_ERROR":
      return e?.validationError || "Please check your input and try again."
    case "STUDENT_ALREADY_IN_SECTION":
      if (e?.studentAlreadyInSection) return e.studentAlreadyInSection
      break
    case "PLACEMENT_INVALID_STATUS":
      if (e?.placementInvalidStatus) return e.placementInvalidStatus
      break
    case "PLACEMENT_NO_USER":
      if (e?.placementNoUser) return e.placementNoUser
      break
    case "NOT_FOUND":
      if (e?.notFound) return e.notFound
      break
    case "INVALID_SECTION":
      if (e?.invalidSection) return e.invalidSection
      break
    case "STUDENT_ALREADY_ENROLLED":
      if (e?.studentAlreadyEnrolled) return e.studentAlreadyEnrolled
      break
    case "APPLICATION_STATUS_CONFLICT":
      if (e?.statusConflict) return e.statusConflict
      break
    case "APPLICATION_STATUS_INVALID":
      if (e?.applicationStatusInvalid) return e.applicationStatusInvalid
      break
    case "BOOKING_CANCELLED":
      if (e?.bookingCancelled) return e.bookingCancelled
      break
    case "INQUIRY_ALREADY_CONVERTED":
      if (e?.inquiryAlreadyConverted) return e.inquiryAlreadyConverted
      break
  }
  return fallback || e?.generic || "Something went wrong. Please try again."
}
