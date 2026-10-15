"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { FileDown, Loader2 } from "lucide-react"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Button } from "@/components/ui/button"
import { ErrorToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { BULK_MAX_ENTITIES } from "../../documents/config"
import { downloadBase64 } from "../../documents/download"
import { generateFromDefaultTemplateBulk } from "../../documents/generate"
import { getReportCardIdsForTemplate } from "../actions/report-cards"

/**
 * Fill the school's own `.docx` report-card template for EVERY card of a term.
 *
 * Chunked on purpose: each filled document is zipped and base64'd into the
 * action response, so a whole term in one call is tens of megabytes. One zip
 * part per `BULK_MAX_ENTITIES` cards, downloaded as it lands, with the count
 * shown — the per-row button in the table still serves a single student.
 */
export function TemplateBulkButton({
  termId,
  gradeId,
}: {
  termId: string
  gradeId?: string
}) {
  const { dictionary } = useDictionary()
  const copy = dictionary?.results?.reportCards
  const docs = dictionary?.school?.documents
  const [total, setTotal] = useState(0)
  const [done, setDone] = useState(0)

  const run = async () => {
    const listed = await getReportCardIdsForTemplate({ termId, gradeId })
    if (!listed.success || !listed.data?.ids.length) {
      ErrorToast(
        listed.success ? (copy?.emptyTerm ?? "") : (docs?.generateFailed ?? "")
      )
      return
    }

    const ids = listed.data.ids
    setTotal(ids.length)
    setDone(0)

    for (let i = 0; i < ids.length; i += BULK_MAX_ENTITIES) {
      const slice = ids.slice(i, i + BULK_MAX_ENTITIES)
      const res = await generateFromDefaultTemplateBulk("REPORT_CARD", slice)
      if (!res.success || !res.data) {
        // `error` carries an ACTION CODE, not a sentence — surfacing it raw
        // prints "TEMPLATE_NOT_FOUND" at an Arabic admin.
        ErrorToast(
          res.error === "TEMPLATE_NOT_FOUND"
            ? (docs?.noTemplate ?? "")
            : actionErrorMessage(
                res.error,
                dictionary,
                docs?.generateFailed ?? ""
              )
        )
        break
      }
      downloadBase64(res.data.filename, res.data.base64, res.data.mime)
      setDone(i + slice.length)
    }

    setTotal(0)
  }

  const busy = total > 0

  return (
    <Button
      variant="outline"
      onClick={run}
      disabled={busy}
      className="gap-2"
      title={docs?.generateAllHint?.replace(
        "{size}",
        String(BULK_MAX_ENTITIES)
      )}
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {busy
        ? (docs?.generateAllProgress ?? "{done} / {total}")
            .replace("{done}", String(done))
            .replace("{total}", String(total))
        : copy?.actions?.downloadAll}
    </Button>
  )
}
