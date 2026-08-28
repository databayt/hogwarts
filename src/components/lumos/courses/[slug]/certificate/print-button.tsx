"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * The certificate's only interactive part, so it is the only client component
 * on the page.
 *
 * `window.print()` rather than a generated PDF: the browser's own dialog
 * already offers "Save as PDF" on every platform this app supports, keeps the
 * page's fonts and RTL layout exactly as rendered, and costs no renderer
 * dependency. The print stylesheet lives with the certificate card
 * (`print:` utilities), which is why this button hides itself under
 * `print:hidden` rather than being conditionally rendered.
 */
export function CertificatePrintButton({ label }: { label: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="print:hidden"
    >
      <Printer className="size-4" aria-hidden="true" />
      {label}
    </Button>
  )
}
