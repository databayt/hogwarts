// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

interface SectionHeadingProps {
  title: string
  className?: string
}

/**
 * Simple section heading for dashboard sections.
 * Just renders a styled title - nothing else.
 */
export function SectionHeading({ title, className }: SectionHeadingProps) {
  return (
    <h2 className={cn("mb-4 text-lg font-semibold", className)}>{title}</h2>
  )
}
