// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useCallback, useState } from "react"
import { pdf } from "@react-pdf/renderer"
import { Download, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { ReceiptDocument, type ReceiptData } from "./receipt-document"

interface DownloadReceiptProps {
  data: ReceiptData
  dictionary?: Dictionary
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function DownloadReceipt({
  data,
  dictionary,
  variant = "outline",
  size = "sm",
}: DownloadReceiptProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const t = (dictionary as any)?.finance?.fees?.receipt as
    | Record<string, string>
    | undefined

  const handleDownload = useCallback(async () => {
    setIsGenerating(true)
    try {
      const blob = await pdf(
        <ReceiptDocument data={data} t={t || {}} />
      ).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `receipt-${data.receiptNumber}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err)
    } finally {
      setIsGenerating(false)
    }
  }, [data, t])

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={isGenerating}
    >
      {isGenerating ? (
        <Loader2 className="me-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="me-2 h-4 w-4" />
      )}
      {isGenerating
        ? t?.generating || "Generating..."
        : t?.downloadReceipt || "Download Receipt"}
    </Button>
  )
}
