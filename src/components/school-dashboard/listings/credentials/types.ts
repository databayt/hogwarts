// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared credential types for the role-agnostic credentials dialog.
 *
 * One dialog serves students, teachers, parents (guardians) and staff. The
 * role tells the server action which person model to mint a User against and
 * which contact fields to resolve for the "share" channel.
 */
export type CredentialsRole = "student" | "teacher" | "guardian" | "staff"

export interface CredentialsPayload {
  username: string
  /** Best email on file (own → guardian fallback for students). Null when none. */
  email: string | null
  /**
   * Plaintext temp password — only present the moment we mint/reset it. Null on
   * read of a pre-existing User (admin must click "Reset Password" to re-issue).
   */
  password: string | null
  /**
   * Best phone on file (own → primary guardian for students), digits only as
   * stored. Drives the WhatsApp "share" channel; null disables it.
   */
  phone: string | null
  /** True the first time a User is minted for this person on this call. */
  isNew: boolean
  /** Student-only: signed up themselves and own their password. Always false for members. */
  isSelfOnboarded: boolean
}
