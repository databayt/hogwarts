// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { ACTION_ERRORS, type ActionErrorCode } from "./action-errors"

/**
 * Resolves an action error code to a translated string.
 *
 * Accepts either:
 * - A known ACTION_ERRORS code (e.g. "NOT_AUTHENTICATED") -> looks up in dictionary
 * - A legacy English string (e.g. "Not authenticated") -> maps to code, then looks up
 * - Any other string -> returns as-is (backward compatible)
 *
 * @param error - The error string from an action response
 * @param dictionary - The i18n dictionary (any shape that has common.errors)
 * @returns Translated error string, or the original if no translation found
 */
export function resolveActionError(
  error: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary?: Record<string, any> | null
): string {
  const errors = dictionary?.common?.errors as
    | Record<string, string>
    | undefined

  // Check if it's a known error code
  if (errors?.[error]) {
    return errors[error]
  }

  // Legacy: check for common English strings and map to codes
  const legacyMap: Record<string, ActionErrorCode> = {
    "Not authenticated": ACTION_ERRORS.NOT_AUTHENTICATED,
    "Missing school context": ACTION_ERRORS.MISSING_SCHOOL,
    Unauthorized: ACTION_ERRORS.UNAUTHORIZED,
    "Not found": ACTION_ERRORS.NOT_FOUND,
  }

  const code = legacyMap[error]
  if (code && errors?.[code]) {
    return errors[code]
  }

  // Return original string if no translation found
  return error
}
