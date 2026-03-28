// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Resolve the admission object from the dictionary.
 * The school dictionary is spread into the root, so the path is:
 *   dictionary.school.admission (from school-en.json / school-ar.json)
 */
function getAdmission(
  dictionary: unknown
): Record<string, unknown> | undefined {
  const d = dictionary as Record<string, unknown> | null | undefined
  const school = d?.school as Record<string, unknown> | undefined
  return school?.admission as Record<string, unknown> | undefined
}

/**
 * Extract apply form dictionary for a specific step.
 * Dictionary path: dictionary.school.admission.apply.form.<step>
 */
export function getApplyDict(
  dictionary: unknown,
  step: string
): Record<string, string> {
  const admission = getAdmission(dictionary)
  const apply = admission?.apply as Record<string, unknown> | undefined
  const form = apply?.form as Record<string, unknown> | undefined
  return ((form?.[step] as Record<string, string>) ?? {}) as Record<
    string,
    string
  >
}

/**
 * Extract apply-level dictionary (for errors, submit, etc.).
 * Dictionary path: dictionary.school.admission.apply
 */
export function getApplyRootDict(dictionary: unknown): Record<string, unknown> {
  const admission = getAdmission(dictionary)
  return ((admission?.apply as Record<string, unknown>) ?? {}) as Record<
    string,
    unknown
  >
}

/**
 * Extract apply error dictionary.
 * Dictionary path: dictionary.school.admission.apply.errors
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
 * Dictionary path: dictionary.school.admission.apply.steps.<step>
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

/**
 * Extract apply form options dictionary (for select option factories).
 * Dictionary path: dictionary.school.admission.apply.form.options
 *
 * Returns a map of option group name to key-value pairs, e.g.:
 * { gender: { MALE: "Male", FEMALE: "Female" }, nationality: { SD: "Sudanese", ... } }
 */
export function getApplyOptionsDict(
  dictionary: unknown
): Record<string, Record<string, string>> {
  const admission = getAdmission(dictionary)
  const apply = admission?.apply as Record<string, unknown> | undefined
  const form = apply?.form as Record<string, unknown> | undefined
  const options = form?.options as
    | Record<string, Record<string, string>>
    | undefined
  return options ?? {}
}
