// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Extract apply form dictionary for a specific step.
 * Dictionary path: dictionary.admission.apply.form.<step>
 */
export function getApplyDict(
  dictionary: unknown,
  step: string
): Record<string, string> {
  const d = dictionary as Record<string, unknown> | null | undefined
  const admission = d?.admission as Record<string, unknown> | undefined
  const apply = admission?.apply as Record<string, unknown> | undefined
  const form = apply?.form as Record<string, unknown> | undefined
  return ((form?.[step] as Record<string, string>) ?? {}) as Record<
    string,
    string
  >
}

/**
 * Extract apply-level dictionary (for errors, submit, etc.).
 * Dictionary path: dictionary.admission.apply
 */
export function getApplyRootDict(dictionary: unknown): Record<string, unknown> {
  const d = dictionary as Record<string, unknown> | null | undefined
  const admission = d?.admission as Record<string, unknown> | undefined
  return ((admission?.apply as Record<string, unknown>) ?? {}) as Record<
    string,
    unknown
  >
}

/**
 * Extract apply error dictionary.
 * Dictionary path: dictionary.admission.apply.errors
 */
export function getApplyErrorDict(dictionary: unknown): Record<string, string> {
  const root = getApplyRootDict(dictionary)
  return ((root?.errors as Record<string, string>) ?? {}) as Record<
    string,
    string
  >
}

/**
 * Extract apply steps dictionary (for headings).
 * Dictionary path: dictionary.admission.apply.steps.<step>
 */
export function getApplyStepDict(
  dictionary: unknown,
  step: string
): Record<string, string> {
  const root = getApplyRootDict(dictionary)
  const steps = root?.steps as Record<string, unknown> | undefined
  return ((steps?.[step] as Record<string, string>) ?? {}) as Record<
    string,
    string
  >
}
