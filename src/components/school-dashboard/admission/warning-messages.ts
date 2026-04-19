// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { EnrollmentWarning } from "./actions"

type AdmissionDict = Dictionary["school"]["admission"]

export function translateEnrollmentWarning(
  warning: EnrollmentWarning,
  dictionary: AdmissionDict
): string {
  const messages = dictionary?.warnings
  switch (warning.code) {
    case "NO_FEE_STRUCTURE_MATCH":
      return (
        messages?.noFeeStructureMatch ||
        "No fee structure matched — fees skipped. Configure a fee structure in Finance > Fees."
      )
    case "APPLICATION_FEE_UNPAID":
      return (
        messages?.applicationFeeUnpaid ||
        "Application fee is unpaid. Enrollment confirmed, but consider collecting payment."
      )
    case "FEE_AUTO_ASSIGN_FAILED":
      return (
        messages?.feeAutoAssignFailed ||
        "Fee auto-assignment failed — assign fees manually from Finance > Fees."
      )
    case "INVOICE_GENERATION_FAILED":
      return (
        messages?.invoiceGenerationFailed ||
        "Invoice generation failed — create the invoice manually."
      )
    case "GUARDIAN_CREATE_FAILED":
      return (
        messages?.guardianCreateFailed ||
        "Guardian creation failed — add the guardian manually."
      )
    default:
      return ""
  }
}
