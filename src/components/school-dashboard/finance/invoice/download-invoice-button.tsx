// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useGenerate } from "@/components/file/generate/use-generate"
import type { Locale } from "@/components/internationalization/config"

import { mapInvoiceToInvoiceData, type InvoiceForPdf } from "./invoice-pdf-data"

export interface DownloadInvoiceButtonProps {
  invoice: InvoiceForPdf
  lang: Locale
  label?: string
}

/**
 * Client "Download PDF" trigger. Wires the existing (previously unwired)
 * InvoiceTemplate into the invoice view via useGenerate().generateInvoice,
 * which renders the PDF and triggers the browser download.
 *
 * Kept in its own module because `useGenerate` statically pulls
 * @react-pdf/renderer plus all six document templates. `download-invoice.tsx`
 * lazy-loads this file so that graph stays out of every invoice route's
 * initial JS and arrives only when the toolbar is actually rendered.
 */
export function DownloadInvoiceButton({
  invoice,
  lang,
  label,
}: DownloadInvoiceButtonProps) {
  const { generateInvoice, isGenerating } = useGenerate()

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isGenerating}
      onClick={() => {
        void generateInvoice(mapInvoiceToInvoiceData(invoice, lang))
      }}
    >
      {isGenerating ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {label ?? "Download PDF"}
    </Button>
  )
}
