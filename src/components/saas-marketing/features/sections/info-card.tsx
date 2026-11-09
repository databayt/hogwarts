// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

interface Props {
  title: string
  description?: string
  className?: string
}

/**
 * One item of a detail-page list (roles, benefits, capabilities, use cases):
 * a hairline rule, the title, one muted line. No box and no icon — the
 * bordered cards with a glyph each (until 2026-11-09) repeated generic art on
 * every item and made the lists read heavy. Static and token-driven, like the
 * rest of the page; the grid around it sets the columns and the air.
 */
export function InfoCard({ title, description, className }: Props) {
  return (
    <div className={cn("border-t pt-5", className)}>
      <h3 className="text-lg font-semibold tracking-tight text-balance">
        {title}
      </h3>
      {description && (
        <p className="text-muted-foreground mt-2 text-base leading-relaxed text-pretty">
          {description}
        </p>
      )}
    </div>
  )
}
