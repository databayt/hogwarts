// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import enAssignments from "@/components/internationalization/dictionaries/en/assignments.json"

/**
 * The messages the assignment schemas speak — `assignments.validation` in the
 * dictionaries. Every field is optional so a builder can take a partial
 * subtree (or nothing) and still produce a working schema.
 */
export type AssignmentValidationMessages = Partial<
  Record<keyof typeof enAssignments.validation, string>
>

/**
 * Messages for code that has no dictionary at hand (server actions parse with
 * the default schemas). They come from the English dictionary file — nothing
 * is spelled in TypeScript, and forms always build with the reader's language.
 */
export const defaultAssignmentValidationMessages: AssignmentValidationMessages =
  enAssignments.validation

/** The `assignments.validation` subtree of a full dictionary, if loaded. */
export function assignmentValidationOf(
  dictionary: unknown
): AssignmentValidationMessages {
  const d = dictionary as {
    assignments?: { validation?: AssignmentValidationMessages }
  } | null
  return d?.assignments?.validation ?? {}
}
