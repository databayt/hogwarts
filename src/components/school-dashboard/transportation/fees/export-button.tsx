"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { StudentTransportFee } from "../actions/fees"

interface Props {
  fees: StudentTransportFee[]
  dictionary: Dictionary
}

/**
 * Escape a value for a CSV cell (RFC 4180) and neutralize spreadsheet formula
 * injection. A student/route name beginning with =, +, -, @ (or a tab) is
 * evaluated as a formula by Excel/LibreOffice on open; prefixing a tab keeps the
 * cell inert while staying invisible to readers.
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t]/.test(value) ? `\t${value}` : value
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

/**
 * Client-side CSV export of the fee preview. The data is already loaded on the
 * page (the user passed the view_fees gate to see it), so we build + download
 * the CSV in the browser — no extra server round-trip or permission needed.
 */
export function FeesExportButton({ fees, dictionary }: Props) {
  const t = dictionary.transportation

  function handleExport() {
    if (fees.length === 0) return
    const headers = [
      t.assignments.fields.student,
      t.assignments.fields.route,
      t.routes.fields.monthlyFee,
    ]
    const rows = fees.map((f) => [
      `${f.firstName} ${f.lastName}`.trim(),
      f.routes.map((r) => r.routeName).join(" | "),
      String(f.monthlyTotal),
    ])
    const csv = [headers, ...rows]
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n")
    // Prepend a UTF-8 BOM so Excel renders Arabic correctly.
    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transport-fees-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={fees.length === 0}
    >
      <Download className="size-4" />
      {t.fees.exportCsv}
    </Button>
  )
}
