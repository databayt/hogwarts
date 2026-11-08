"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Video } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { type Locale } from "@/components/internationalization/config"
import { liveJoinHref } from "@/components/school-dashboard/live/join-link"

/**
 * A visible Join on a timetable cell or row, pointing at the slot's join link.
 *
 * A plain anchor on purpose — `next/link` would prefetch, and the page behind
 * the link may write today's room. `stopPropagation` keeps the tap from also
 * opening the cell's detail dialog underneath it.
 */
export function JoinLinkButton({
  timetableId,
  lang,
  label,
  className,
}: {
  timetableId: string
  lang: Locale
  label: string
  className?: string
}) {
  return (
    <Button
      asChild
      size="sm"
      className={cn("h-7 gap-1.5 rounded-full px-3", className)}
    >
      <a
        href={liveJoinHref(lang, timetableId)}
        onClick={(e) => e.stopPropagation()}
      >
        <Video className="size-3.5" aria-hidden />
        {label}
      </a>
    </Button>
  )
}
