"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import type { DocumentTemplateCategory } from "@prisma/client"
import { FileDown, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getStarterTemplate } from "./actions"
import { downloadBase64 } from "./download"

/**
 * Downloads the pre-tagged starter `.docx` for `category`.
 *
 * Its own component because it is the answer to two different dead ends: the
 * empty template list ("no templates yet" with nothing to start from) and a
 * just-uploaded template that turned out to carry no merge tags — which stores
 * fine and then fills as a blank copy of itself, a failure a school only
 * discovers after printing.
 */
export function StarterButton({
  category,
  variant = "ghost",
  className,
}: {
  category: DocumentTemplateCategory
  variant?: "ghost" | "outline" | "secondary"
  className?: string
}) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.documents
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setBusy(true)
    setError(null)
    const res = await getStarterTemplate(category)
    setBusy(false)
    if (res.success && res.data) {
      downloadBase64(res.data.filename, res.data.base64, res.data.mime)
    } else {
      setError(res.error ?? d?.starterFailed ?? "Could not build starter.")
    }
  }

  return (
    <div className={className}>
      <Button
        size="sm"
        variant={variant}
        onClick={handleClick}
        disabled={busy}
        title={d?.starterHint}
      >
        {busy ? (
          <Loader2 className="me-1 size-4 animate-spin" />
        ) : (
          <FileDown className="me-1 size-4" />
        )}
        {d?.starter}
      </Button>
      {error && <p className="text-destructive mt-1 text-xs">{error}</p>}
    </div>
  )
}
