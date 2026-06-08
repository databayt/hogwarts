// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useState } from "react"
import { Download, Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useGenerate } from "@/components/file/generate/use-generate"
import type { Locale } from "@/components/internationalization/config"

import { mapInvoiceToInvoiceData, type InvoiceForPdf } from "./invoice-pdf-data"

interface DownloadInvoiceButtonProps {
  invoice: InvoiceForPdf
  lang: Locale
  label?: string
}

/**
 * Client "Download PDF" trigger. Wires the existing (previously unwired)
 * InvoiceTemplate into the invoice view via useGenerate().generateInvoice,
 * which renders the PDF and triggers the browser download.
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

interface SendInvoiceButtonProps {
  invoiceId: string
  invoiceNo: string
  label?: string
  subjectPrefix?: string
  sentLabel?: string
  errorLabel?: string
}

/**
 * Client "Send invoice" trigger. Wires the existing (previously caller-less)
 * sendInvoiceEmail server action into the UI so an admin can actually email /
 * re-email an invoice. Dynamic-imports the action (mirrors the invoice block's
 * existing pattern) and surfaces success/failure via toast.
 */
export function SendInvoiceButton({
  invoiceId,
  invoiceNo,
  label,
  subjectPrefix,
  sentLabel,
  errorLabel,
}: SendInvoiceButtonProps) {
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    try {
      setIsSending(true)
      const actions = await import("./actions")
      const subject = `${subjectPrefix ?? "Invoice"} ${invoiceNo}`
      const res = await actions.sendInvoiceEmail(invoiceId, subject)
      if (res.success) {
        toast.success(sentLabel ?? "Invoice sent")
      } else {
        toast.error(res.error || errorLabel || "Failed to send invoice")
      }
    } catch {
      toast.error(errorLabel ?? "Failed to send invoice")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isSending}
      onClick={handleSend}
    >
      {isSending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Send className="size-4" />
      )}
      {label ?? "Send"}
    </Button>
  )
}
