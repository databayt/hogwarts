"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One results renderer for BOTH bulk-import flows:
 *
 *  - `onboarding/import/`            (AdmissionChannel ONBOARDING_IMPORT)
 *  - `school-dashboard/school/bulk/` (AdmissionChannel BULK_IMPORT)
 *
 * They previously hand-rolled a results panel each, and between them dropped
 * three of the five things the import engine returns:
 *
 *  | field         | onboarding (before) | /school/bulk (before) |
 *  | ------------- | ------------------- | --------------------- |
 *  | imported/etc. | shown               | counts only           |
 *  | errors        | shown               | NOT rendered          |
 *  | credentials   | NOT rendered        | shown                 |
 *  | warnings      | NOT rendered        | NOT rendered          |
 *  | accessCodes   | NOT rendered        | NOT rendered          |
 *
 * `warnings` is where a skipped duplicate or an unmatched grade is explained —
 * i.e. the answer to "why is `imported` lower than my row count" — and
 * `accessCodes` is the only place the generated parent-link codes ever surface.
 * Both server actions have returned them for a while; nothing displayed them.
 * (`listings/students/ISSUE.md` recorded this as shipped — the server half was.)
 */
import { useCallback } from "react"
import {
  AlertCircle,
  CheckCircle2,
  Info,
  KeyRound,
  Loader2,
} from "lucide-react"

import { formatDate } from "@/lib/i18n-format"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/components/internationalization/config"

export interface ImportResultData {
  imported: number
  failed: number
  skipped: number
  errors: Array<{ row: number; error: string; details?: string }>
  /** Non-fatal per-row notes: a skipped duplicate, an unmatched grade. */
  warnings?: Array<{ row: number; warning: string }>
  /** Parent-link codes minted for imported students. */
  accessCodes?: Array<{ studentId: string; code: string; expiresAt: string }>
  /** Plaintext temp passwords — single-use, so this is the ONLY place they
   *  can be read. Never logged, never re-derivable. */
  credentials?: Array<{
    row: number
    name: string
    username: string
    email: string | null
    role: string
    password: string
  }>
}

/** Every string this panel can render. No `|| "English"` fallbacks inside the
 *  component — a missing key must be visible, not silently papered over. */
export interface ImportResultTranslations {
  importing?: string
  imported?: string
  skipped?: string
  failed?: string
  row?: string
  warnings?: string
  accessCodes?: string
  expires?: string
  downloadLogins?: string
}

/** Excel/Sheets treat a leading =,+,-,@ as a formula — prefix with ' so an
 *  imported name like `=cmd()` cannot execute in the admin's spreadsheet. */
function csvCell(value: string): string {
  const v = value ?? ""
  const guarded = /^[=+\-@]/.test(v) ? `'${v}` : v
  return `"${guarded.replace(/"/g, '""')}"`
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Build + download the minted-credentials sheet so the admin can distribute
 * logins. Passwords are crypto-random + single-use, so this file is the only
 * place they can ever be read — which is also why it must never be logged.
 */
export function downloadCredentialsCsv(
  credentials: NonNullable<ImportResultData["credentials"]>,
  entityLabel: string
): void {
  const header = ["name", "username", "email", "role", "password"]
  const lines = [
    header.join(","),
    ...credentials.map((c) =>
      [c.name, c.username, c.email ?? "", c.role, c.password]
        .map((cell) => csvCell(String(cell)))
        .join(",")
    ),
  ]
  downloadCsv(lines.join("\n"), `${entityLabel}-logins.csv`)
}

export function ImportResultPanel({
  result,
  isImporting = false,
  entityLabel,
  t,
  lang = "ar",
}: {
  result: ImportResultData
  /** True while phase 2 is still committing — the counts shown are a preview. */
  isImporting?: boolean
  /** Used to name the downloaded credentials file, e.g. "students". */
  entityLabel: string
  t: ImportResultTranslations
  /** Locale for dates (access-code expiry). Defaults to Arabic. */
  lang?: Locale
}) {
  const credentials = result.credentials ?? []
  const warnings = result.warnings ?? []
  const accessCodes = result.accessCodes ?? []

  const handleDownloadCredentials = useCallback(
    () => downloadCredentialsCsv(credentials, entityLabel),
    [credentials, entityLabel]
  )

  return (
    <div className="space-y-2 text-sm">
      {result.imported > 0 && (
        <div
          className={`flex items-center gap-2 ${
            isImporting
              ? "text-orange-600"
              : "text-green-700 dark:text-green-400"
          }`}
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          {result.imported} {isImporting ? t.importing : t.imported}
        </div>
      )}

      {result.skipped > 0 && (
        <div className="text-muted-foreground flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" />
          {result.skipped} {t.skipped}
        </div>
      )}

      {result.failed > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {result.failed} {t.failed}
          </div>
          <div className="max-h-[80px] overflow-y-auto rounded border p-2 text-xs">
            {result.errors.map((err, i) => (
              <div key={i} className="text-muted-foreground py-0.5">
                {t.row} {err.row}: {err.error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The gap between "rows in my file" and `imported` is explained here and
          nowhere else — without it the count difference looks like data loss. */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {warnings.length} {t.warnings}
          </div>
          <div className="max-h-[80px] overflow-y-auto rounded border p-2 text-xs">
            {warnings.map((w, i) => (
              <div key={i} className="text-muted-foreground py-0.5">
                {t.row} {w.row}: {w.warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {accessCodes.length > 0 && (
        <div className="space-y-1">
          <div className="text-muted-foreground flex items-center gap-2">
            <KeyRound className="h-4 w-4 shrink-0" />
            {accessCodes.length} {t.accessCodes}
          </div>
          <div className="max-h-[80px] overflow-y-auto rounded border p-2 font-mono text-xs">
            {accessCodes.map((c) => (
              <div
                key={c.studentId}
                className="text-muted-foreground flex justify-between gap-2 py-0.5"
              >
                <span>{c.code}</span>
                <span className="font-sans">
                  {t.expires} {formatDate(c.expiresAt, lang)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {credentials.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadCredentials}
        >
          <KeyRound className="me-2 h-4 w-4" />
          {t.downloadLogins} ({credentials.length})
        </Button>
      )}
    </div>
  )
}
