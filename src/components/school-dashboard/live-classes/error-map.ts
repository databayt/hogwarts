// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

/**
 * Map a server action error code to a translated user-facing string.
 * Falls back to a generic "internal error" message if the code is unknown.
 */
export function resolveLiveClassError(
  dictionary: Dictionary | undefined,
  code: string | undefined
): string {
  const errs = dictionary?.liveClasses?.errors
  const fallback = "Something went wrong."

  if (!code) return fallback

  switch (code) {
    case "NOT_AUTHENTICATED":
      return errs?.notAuthenticated ?? "You need to sign in."
    case "MISSING_SCHOOL":
      return errs?.missingSchool ?? "School context missing."
    case "UNAUTHORIZED":
      return errs?.unauthorized ?? "You do not have permission."
    case "VALIDATION_ERROR":
      return errs?.validation ?? "Please check the form."
    case "LIVE_CLASS_NOT_FOUND":
      return errs?.notFound ?? "Live class not found."
    case "LIVE_CLASS_INVALID_STATE":
      return errs?.invalidState ?? "The class is not in the right state."
    case "LIVE_CLASS_ROOM_FULL":
      return errs?.roomFull ?? "Room is full."
    case "LIVE_CLASS_MAX_DURATION_EXCEEDED":
      return errs?.maxDuration ?? "Class duration exceeds the school maximum."
    case "LIVE_CLASS_TOKEN_FAILED":
      return errs?.tokenFailed ?? "Could not issue a room token."
    case "LIVE_CLASS_PARTICIPANT_DENIED":
      return errs?.participantDenied ?? "You are not enrolled in this class."
    case "LIVE_CLASS_PROVIDER_UNAVAILABLE":
      return (
        errs?.providerUnavailable ??
        "Video service is unavailable. Try again shortly."
      )
    case "LIVE_CLASS_RECORDING_NOT_FOUND":
      return errs?.recordingNotFound ?? "Recording not found."
    case "LIVE_CLASS_RECORDING_FAILED":
      return errs?.recordingFailed ?? "Could not load the recording."
    default:
      return fallback
  }
}
