// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Localized text for a failed paper action.
 *
 * The paper server actions return an English `error` (for logs) and a stable
 * `code`. The UI never shows the English: it looks the code up in
 * `exams.paper.errors`, then in the shared `common.errors` map, then falls
 * back to `exams.paper.errors.generic`.
 */
import { actionErrorMessage } from "@/lib/resolve-action-error"

export function paperErrorText(
  result: { error?: string; code?: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dictionary: Record<string, any> | null | undefined
): string {
  const errors = (dictionary?.exams?.paper?.errors ?? {}) as Record<
    string,
    string
  >
  const generic = errors.generic ?? ""
  const code = result.code
  if (!code) return generic
  return errors[code] ?? actionErrorMessage(code, dictionary, generic)
}
