// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

import { Glyph } from "./glyph"

interface Props {
  title: string
  description: string
  className?: string
}

/**
 * Non-link content card mirroring the `Card` atom used by the features landing
 * grid: bare glyph on top, title + muted description below, subtle border that
 * warms to `primary` on hover. Keeps the detail page coherent with the rest of
 * the marketing site.
 */
export function InfoCard({ title, description, className }: Props) {
  return (
    <div
      className={cn(
        "bg-background hover:border-primary h-full rounded-lg border p-6 transition-[border-color]",
        className
      )}
    >
      <Glyph title={title} className="mb-5" />
      <h4 className="font-semibold tracking-tight">{title}</h4>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {description}
      </p>
    </div>
  )
}
