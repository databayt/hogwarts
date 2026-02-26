// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Action error codes for i18n-safe error responses.
 *
 * Server actions return these codes instead of hardcoded English strings.
 * Clients resolve them to translated strings via the dictionary.
 *
 * @see src/lib/resolve-action-error.ts for client-side resolution
 * @see src/components/internationalization/en.json common.errors for translations
 */

export const ACTION_ERRORS = {
  NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
  MISSING_SCHOOL: "MISSING_SCHOOL",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  RATE_LIMITED: "RATE_LIMITED",
  UNKNOWN: "UNKNOWN",
} as const

export type ActionErrorCode = (typeof ACTION_ERRORS)[keyof typeof ACTION_ERRORS]

/**
 * Helper to create error responses with codes.
 * Returns a shape compatible with ActionResponse.
 *
 * @param code - One of the ACTION_ERRORS constants
 * @param details - Optional additional context (not shown to users, useful for debugging)
 */
export function actionError(code: ActionErrorCode, details?: string) {
  return {
    success: false as const,
    error: code,
    details,
  }
}
