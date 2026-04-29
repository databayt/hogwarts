// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Client-side helper that converts a server-action ActionErrorCode (returned in
 * `result.error`) plus the optional structured `details` payload into a fully
 * translated string. Pair with `dictionary.school.classrooms.errors.*` keys.
 */

type ErrorsDict = {
  limitReached?: string
  limitReachedWithRequest?: string
  capacityExceedsRoom?: string
  noTeachers?: string
  noPeriods?: string
  hasClasses?: string
  hasTimetables?: string
  hasConstraints?: string
  alreadyExists?: string
  notFound?: string
  missingSchool?: string
  notAuthenticated?: string
  unauthorized?: string
  validation?: string
  createFailed?: string
  updateFailed?: string
  deleteFailed?: string
  loadFailed?: string
}

function format(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
    template
  )
}

function safeParse(details?: string | null): Record<string, unknown> | null {
  if (!details) return null
  try {
    return JSON.parse(details)
  } catch {
    return null
  }
}

export function resolveClassroomError(
  code: string | undefined,
  details: string | undefined,
  errors: ErrorsDict | undefined,
  fallback: string
): string {
  const e = errors ?? {}
  const parsed = safeParse(details)

  switch (code) {
    case "CLASSROOM_LIMIT_REACHED": {
      if (parsed && "requested" in parsed && e.limitReachedWithRequest) {
        return format(e.limitReachedWithRequest, {
          limit: (parsed.limit as number) ?? 0,
          current: (parsed.current as number) ?? 0,
          requested: (parsed.requested as number) ?? 0,
        })
      }
      if (parsed && e.limitReached) {
        return format(e.limitReached, {
          limit: (parsed.limit as number) ?? 0,
          current: (parsed.current as number) ?? 0,
        })
      }
      return e.limitReached ?? fallback
    }

    case "CAPACITY_EXCEEDS_ROOM":
      if (parsed && e.capacityExceedsRoom) {
        return format(e.capacityExceedsRoom, {
          sectionCapacity: (parsed.sectionCapacity as number) ?? 0,
          roomName: (parsed.roomName as string) ?? "",
          roomCapacity: (parsed.roomCapacity as number) ?? 0,
        })
      }
      return e.capacityExceedsRoom ?? fallback

    case "HAS_DEPENDENCIES":
      if (parsed?.kind === "classes" && e.hasClasses) {
        return format(e.hasClasses, { count: (parsed.count as number) ?? 0 })
      }
      if (parsed?.kind === "timetables" && e.hasTimetables) {
        return format(e.hasTimetables, { count: (parsed.count as number) ?? 0 })
      }
      if (parsed?.kind === "constraints" && e.hasConstraints) {
        return format(e.hasConstraints, {
          count: (parsed.count as number) ?? 0,
        })
      }
      return e.deleteFailed ?? fallback

    case "NO_TEACHERS_FOUND":
      return e.noTeachers ?? fallback
    case "NO_PERIODS_FOUND":
      return e.noPeriods ?? fallback
    case "ALREADY_EXISTS":
      return e.alreadyExists ?? fallback
    case "CLASSROOM_NOT_FOUND":
    case "NOT_FOUND":
      return e.notFound ?? fallback
    case "MISSING_SCHOOL":
      return e.missingSchool ?? fallback
    case "NOT_AUTHENTICATED":
      return e.notAuthenticated ?? fallback
    case "UNAUTHORIZED":
      return e.unauthorized ?? fallback
    case "VALIDATION_ERROR":
      return e.validation ?? fallback
    case "CREATE_FAILED":
      return e.createFailed ?? fallback
    case "UPDATE_FAILED":
      return e.updateFailed ?? fallback
    case "DELETE_FAILED":
      return e.deleteFailed ?? fallback
    case "LOAD_FAILED":
      return e.loadFailed ?? fallback
    default:
      return fallback
  }
}
