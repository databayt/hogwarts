"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The one way the teacher wizard finishes — the employment step's Create AND
 * the footer's "Skip & Create". Both used to call `completeTeacherWizard` and
 * ignore a failure: the step stayed put with no message, and the footer path
 * navigated to the list as if the teacher had been created.
 *
 * Returns true when the wizard finished; callers own the navigation.
 */
import { actionErrorMessage } from "@/lib/resolve-action-error"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import { completeTeacherWizard } from "./actions"

export async function finishTeacherWizard(
  teacherId: string,
  /** The root dictionary from `useDictionary()` (any shape). */
  dictionary: unknown
): Promise<boolean> {
  const dict = dictionary as Record<string, unknown> | undefined
  const school = dict?.school as Record<string, unknown> | undefined
  const teachers = school?.teachers as Record<string, unknown> | undefined
  const wizard = teachers?.wizard as Record<string, string> | undefined
  const fallback = wizard?.failedToSave || "Failed to save"

  try {
    const result = await completeTeacherWizard(teacherId)
    if (!result.success) {
      ErrorToast(
        actionErrorMessage(
          "error" in result ? result.error : undefined,
          dict,
          fallback
        )
      )
      return false
    }
    SuccessToast(wizard?.created || "Teacher added")
    return true
  } catch {
    ErrorToast(fallback)
    return false
  }
}
