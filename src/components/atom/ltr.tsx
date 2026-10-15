// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { cn } from "@/lib/utils"

/**
 * An isolated left-to-right run inside RTL text — letter grades, percentages,
 * scores, file names. Without it the bidi algorithm moves the neutral marks
 * to the wrong end: "A+" reads "+A", "100%" reads "%100", ".docx" reads "docx.".
 */
export function Ltr({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <bdi dir="ltr" className={cn("tabular-nums", className)}>
      {children}
    </bdi>
  )
}
