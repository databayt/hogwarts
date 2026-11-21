// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server-safe: no hooks, no handlers — usable from server and client trees.

import { Badge } from "@/components/ui/badge"
import type { Dictionary } from "@/components/internationalization/dictionaries"

/** The `liveClasses.makeup` labels (live-classes.json) — one slice for every make-up surface. */
export type MakeupLabels = Dictionary["liveClasses"]["makeup"]

/**
 * «حصة تعويضية» — the small tag on a class that replaces a missed one.
 *
 * The word comes from the caller: the landing cards read it off their own
 * dictionary slice, the class page from `liveClasses.makeup.badge`. Renders
 * nothing without a label, so a missing key never prints an empty pill.
 */
export function MakeupBadge({
  label,
  className,
}: {
  label: string | undefined
  className?: string
}) {
  if (!label) return null
  return (
    <Badge
      variant="outline"
      className={className ?? "shrink-0 font-normal"}
      data-slot="makeup-badge"
    >
      {label}
    </Badge>
  )
}
