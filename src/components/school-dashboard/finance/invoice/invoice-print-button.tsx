"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Props {
  label: string
  variant?: "default" | "outline" | "ghost"
}

/**
 * Plain window.print() — the admission pattern. The global @media print rules
 * in globals.css strip app chrome; everything marked print:hidden disappears,
 * leaving the InvoiceSheet as a clean A4 document.
 */
export function InvoicePrintButton({ label, variant = "outline" }: Props) {
  return (
    <Button
      variant={variant}
      size="sm"
      className="print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="me-2 h-4 w-4" />
      {label}
    </Button>
  )
}
