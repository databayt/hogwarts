// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

type ComplianceDict = NonNullable<Dictionary["compliance"]>

export function resolveComplianceError(
  dict: ComplianceDict,
  errorCode?: string
): string {
  if (!errorCode) return dict.errors.NOT_AUTHENTICATED
  const errors = dict.errors as Record<string, string>
  return errors[errorCode] ?? errors.VALIDATION_FAILED ?? errorCode
}
