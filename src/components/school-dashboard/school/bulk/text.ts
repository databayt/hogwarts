// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { Issue } from "./engine/types"

export type BulkText = Dictionary["school"]["bulk"]

/** "{count} rows" + { count: 3 } → "3 rows". */
export function fmt(
  template: string | undefined,
  params: Record<string, string | number> = {}
): string {
  return (template ?? "").replace(/\{(\w+)\}/g, (_, k: string) =>
    params[k] != null ? String(params[k]) : ""
  )
}

export function issueText(t: BulkText, issue: Issue): string {
  const codes = t.codes as Record<string, string>
  return fmt(codes[issue.code] ?? issue.code, issue.params)
}

export function fieldLabel(t: BulkText, key: string): string {
  return (t.fields as Record<string, string>)[key] ?? key
}

export function errorText(t: BulkText, code: string): string {
  const errors = t.errors as Record<string, string>
  return errors[code] ?? errors.generic
}
