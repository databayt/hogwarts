// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

interface Props {
  title: ReactNode
  description?: ReactNode
  /** Start-aligned by default; the closing CTA centres. */
  align?: "start" | "center"
  className?: string
}

/**
 * The one section header of /features/<id>: the hero's display serif at a
 * single size (`.feature-section-title`, styles/container.css), an optional
 * muted lead, one bottom gap. Every section below the hero uses it, so the
 * page reads as one system instead of one style per section.
 */
export function SectionTitle({
  title,
  description,
  align = "start",
  className,
}: Props) {
  return (
    <div
      className={cn(
        "mb-8 max-w-3xl md:mb-10",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <h2 className="feature-section-title text-balance">{title}</h2>
      {description && (
        <p className="text-muted-foreground mt-3 text-lg text-pretty">
          {description}
        </p>
      )}
    </div>
  )
}
