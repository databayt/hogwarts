// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface SectionHeaderProps {
  title: string
  description?: string
  /** "See all" destination; renders as a quiet link with a chevron. */
  href?: string
  linkLabel?: string
  /** Anything else that belongs on the heading's line — one pill, at most. */
  action?: ReactNode
  className?: string
}

/**
 * A section's title line, the way the phone dashboard and /live set theirs:
 * 18px semibold, a hint under it when the title needs one, and the section's
 * way out ("see all", or a single pill) on the same line at the far end.
 *
 * No icon chip beside the title. The sections this replaces carried a tinted
 * square with a glyph in it, which on a 390px screen spent a third of the line
 * repeating what the words already said.
 */
export function SectionHeader({
  title,
  description,
  href,
  linkLabel,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h2 className="text-lg leading-7 font-semibold text-balance">
          {title}
        </h2>
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-sm text-pretty">
            {description}
          </p>
        ) : null}
      </div>
      {href && linkLabel ? (
        <Link
          href={href}
          className="text-muted-foreground hover:text-foreground inline-flex shrink-0 items-center gap-0.5 pb-0.5 text-sm transition-colors"
        >
          {linkLabel}
          <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        </Link>
      ) : null}
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
