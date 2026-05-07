// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface Props {
  dictionary: Dictionary
  /** When the user has any filter set, show a "reset" CTA back to the bare page */
  resetHref: string
  hasFilters: boolean
}

export function CommunityEmptyState({
  dictionary,
  resetHref,
  hasFilters,
}: Props) {
  // Optional chaining everywhere — `community` is a new key and any older
  // dictionary fallback won't have it (the loader falls back to en when a key
  // is missing; this is the inner safety net for partial overrides).
  const c = dictionary?.community?.empty
  return (
    <div className="border-muted-foreground/20 flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <h3 className="text-lg font-semibold tracking-tight">
        {c?.title ?? "No resources match these filters"}
      </h3>
      <p className="text-muted-foreground max-w-md text-sm">
        {c?.description ?? "Try a different curriculum or grade."}
      </p>
      {hasFilters ? (
        <Link
          href={resetHref}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          {c?.reset ?? "Reset filters"}
        </Link>
      ) : null}
    </div>
  )
}
