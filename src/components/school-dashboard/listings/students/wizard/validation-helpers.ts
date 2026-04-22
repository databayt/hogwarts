// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Cross-step completeness checks for the student wizard. Mirrors the shape of
// application/validation-helpers.ts. Only `personal` is a required step; the
// other three (attachments / location / academic) are all optional. These
// predicates power better error messages on wizard complete.

export interface PersonalCompleteness {
  hasName: boolean
  hasParent: boolean
}

/**
 * Personal step is the only required step. It is considered complete when the
 * student has a name AND at least one parent is linked (StudentGuardian rows
 * with type "father" or "mother").
 */
export function getPersonalCompleteness(input: {
  firstName: string | null
  lastName: string | null
  hasFatherOrMother: boolean
}): PersonalCompleteness {
  return {
    hasName:
      (input.firstName?.trim().length ?? 0) > 0 &&
      (input.lastName?.trim().length ?? 0) > 0,
    hasParent: input.hasFatherOrMother,
  }
}

export function isPersonalComplete(c: PersonalCompleteness): boolean {
  return c.hasName && c.hasParent
}

/**
 * Human-readable list of missing requirements — useful for surfacing a
 * detailed error on completeStudentWizard failures.
 */
export function listMissingRequirements(c: PersonalCompleteness): string[] {
  const missing: string[] = []
  if (!c.hasName) missing.push("name")
  if (!c.hasParent) missing.push("parent")
  return missing
}
