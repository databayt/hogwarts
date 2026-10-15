"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The quiet save indicator from the title editor, shared: a spinner while a
 * save is in flight, then a check + "Saved" that fades after two seconds.
 * Pass `savedAt = Date.now()` after each successful save.
 */
import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface SaveStatusProps {
  pending: boolean
  savedAt: number | null
  className?: string
}

export function SaveStatus({ pending, savedAt, className }: SaveStatusProps) {
  const { dictionary } = useDictionary()
  const s = (dictionary as any)?.schoolConfig?.status ?? {}
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (!savedAt) return
    setShowSaved(true)
    const t = setTimeout(() => setShowSaved(false), 2000)
    return () => clearTimeout(t)
  }, [savedAt])

  return (
    <div
      aria-live="polite"
      className={cn(
        "text-muted-foreground flex h-5 items-center gap-1 text-xs",
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 className="size-3 animate-spin" />
          {s.saving ?? "Saving…"}
        </>
      ) : showSaved ? (
        <>
          <Check className="size-3 text-green-600" />
          {s.saved ?? "Saved"}
        </>
      ) : null}
    </div>
  )
}
