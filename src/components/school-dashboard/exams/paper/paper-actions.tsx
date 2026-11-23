"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paper Quick Actions
 * Download PDF and Print buttons using BlobProvider for client-side PDF generation
 */
import { useState } from "react"
import { BlobProvider } from "@react-pdf/renderer"
import { Download, Loader2, Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import { getTemplate } from "./templates"
import type { ExamPaperData } from "./types"

interface PaperActionsProps {
  data: ExamPaperData | null
  locale: "en" | "ar"
}

export function PaperActions({ data }: PaperActionsProps) {
  const dict = useDictionaryFallback()
  const t = (dict as any)?.exams?.paper?.actions ?? {}
  const [isPrinting, setIsPrinting] = useState(false)

  if (!data) return null

  const templateEntry = getTemplate(data.config.template)
  const TemplateComponent = templateEntry.component
  const document = <TemplateComponent data={data} />

  const handlePrint = (url: string) => {
    setIsPrinting(true)
    const printWindow = window.open(url, "_blank")
    if (printWindow) {
      printWindow.addEventListener("load", () => {
        printWindow.print()
        setIsPrinting(false)
      })
    } else {
      setIsPrinting(false)
    }
  }

  const handleDownload = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement("a")
    a.href = url
    a.download = `${data.exam.title || "exam"}-${data.metadata.versionCode || "paper"}.pdf`
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <BlobProvider document={document}>
      {({ blob, url, loading, error }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loading || !blob}
            onClick={() => blob && handleDownload(blob)}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ms-2">
              {loading ? (t.preparing ?? "") : (t.downloadPdf ?? "")}
            </span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={loading || !url || isPrinting}
            onClick={() => url && handlePrint(url)}
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            <span className="ms-2">
              {isPrinting ? (t.printing ?? "") : (t.print ?? "")}
            </span>
          </Button>
        </div>
      )}
    </BlobProvider>
  )
}
