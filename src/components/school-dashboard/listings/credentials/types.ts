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
  /** Every name part — credentials, slips and shares show the full name. */
  fullName?: string
  /**
   * The LOGIN email — the address that signs this person in (`User.email`),
   * shown and copied next to the username. Null when the account has none;
   * never a contact fallback, so an admin can't hand out a dead login.
   */
  email: string | null
  /** Best email to send the credentials to (own → guardian fallback for students). Drives the mailto channel. */
  contactEmail?: string | null
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
  /**
   * Set when the password was KEPT because this login already works for its
   * owner: the last successful sign-in (or the moment they chose their own
   * password), as an ISO string. With it, `password` is null and the dialog
   * offers an explicit, confirmed reset instead of a fresh PIN (hogwarts#473).
   * Absent or null on a login that was minted or reset on this call.
   */
  lastSignedInAt?: string | null
  /**
   * True when the password was kept because we could not tell whether the
   * login works (the lookup failed). Same dialog state, no date to show.
   */
  passwordKept?: boolean
}
