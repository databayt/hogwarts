// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who may mint, reveal or reset someone else's login.
 *
 * Generating credentials returns a fresh password in plain text, so whoever
 * can call it can take over the account. Only the school's administrators
 * (and platform developers) may — never a teacher, student or parent, even
 * inside the same school.
 */
export const CREDENTIAL_ADMIN_ROLES = ["ADMIN", "DEVELOPER"] as const

export function canManageCredentials(role: string | null | undefined): boolean {
  return (CREDENTIAL_ADMIN_ROLES as readonly string[]).includes(role ?? "")
}
