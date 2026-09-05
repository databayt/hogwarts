"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The one way the student wizard finishes — used by the academic step's Next
 * button AND the footer's "Skip & Create". Both used to call
 * `completeStudentWizard` and drop most of what it returned: the footer path
 * ignored the result entirely, and the academic step toasted the warnings but
 * never looked at `credentials`. The temp password the core mints for a new
 * login is plaintext exactly once, at that moment — so every student created
 * through the wizard had a login nobody could ever read, until an admin found
 * "Generate Credentials" in the row menu and reset it.
 *
 * Returns true when the wizard finished; callers own the navigation.
 */
import { ErrorToast, WarningToast } from "@/components/atom/toast"
import { translateEnrollmentWarning } from "@/components/school-dashboard/admission/warning-messages"

import { openCredentialsDialog } from "../../credentials"
import { setCachedCredentials } from "../../credentials/store"
import { completeStudentWizard } from "./actions"

export async function finishStudentWizard(
  studentId: string,
  /** The root dictionary from `useDictionary()` (any shape). */
  dictionary: unknown
): Promise<boolean> {
  const school = (dictionary as Record<string, unknown> | undefined)?.school as
    | Record<string, unknown>
    | undefined
  const students = school?.students as Record<string, unknown> | undefined
  const tAcademic = students?.academic as Record<string, string> | undefined
  const admissionDict = school?.admission as
    | Parameters<typeof translateEnrollmentWarning>[1]
    | undefined
  const requirementsMsg =
    tAcademic?.completeRequirements ||
    "Complete the Personal step first: a name and at least one parent are required."

  try {
    const result = await completeStudentWizard(studentId)
    if (!result.success || !result.data) {
      // `error` is a raw ACTION_ERRORS code, never user text. The expected
      // failure is the missing name/parent gate — say that in words; anything
      // rarer gets the generic translated message (issue #380).
      const code = "error" in result ? result.error : undefined
      ErrorToast(
        code === "VALIDATION_ERROR" || !code
          ? requirementsMsg
          : (students?.failedToCreate as string | undefined) || requirementsMsg
      )
      return false
    }

    // Non-fatal provisioning notes — no fee structure for the grade, no grade
    // so no fees, a seat in a grade with no classes. Same translator the
    // admission Confirm-Enrollment button uses.
    for (const w of result.data.warnings ?? []) {
      const msg = admissionDict
        ? translateEnrollmentWarning(
            w as Parameters<typeof translateEnrollmentWarning>[0],
            admissionDict
          )
        : ""
      if (msg) WarningToast(msg)
    }

    // Hand the minted login to the shared credentials dialog. Its store is
    // module-level and the list page mounts <CredentialsDialog/>, so seeding
    // it here and navigating to /students opens the dialog there — the same
    // dialog the row menu's "Generate Credentials" uses, showing the same
    // fields, without a second server round-trip or a second password.
    if (result.data.credentials) {
      setCachedCredentials("student", studentId, {
        username: result.data.credentials.username,
        password: result.data.credentials.password,
        email: null,
        phone: result.data.phone,
        isNew: true,
        isSelfOnboarded: false,
      })
      openCredentialsDialog("student", studentId, result.data.name)
    }
    return true
  } catch (e) {
    ErrorToast(e instanceof Error ? e.message : requirementsMsg)
    return false
  }
}
