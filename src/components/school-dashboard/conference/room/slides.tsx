"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"

import type { Slides } from "./class-channel"
import type { RoomLabels } from "./labels"

interface SlidesViewProps {
  slides: Slides
  canControl: boolean
  onPage: (page: number) => void
  onStop: () => void
  labels: RoomLabels
}

/**
 * The presented document. The browser's own PDF viewer renders it (no
 * viewer library shipped to every student's phone); the host's page number
 * travels on the data channel and lands in the URL fragment, which the
 * viewer honours on Chromium and Firefox. iOS Safari shows the first page
 * only — a known limit, recorded in the block's ISSUE.md.
 */
export function SlidesView({
  slides,
  canControl,
  onPage,
  onStop,
  labels,
}: SlidesViewProps) {
  const src = `${slides.url}#page=${slides.page}&toolbar=0&navpanes=0`
  return (
    <div className="relative flex h-full w-full flex-col rounded-lg bg-neutral-900">
      <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-white">
        <span className="truncate font-medium">{slides.title}</span>
        <span className="text-white/70">
          · {labels.page} {slides.page}
        </span>
        {canControl && (
          <span className="ms-auto flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
              aria-label={labels.prevPage}
              disabled={slides.page <= 1}
              onClick={() => onPage(slides.page - 1)}
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
              aria-label={labels.nextPage}
              onClick={() => onPage(slides.page + 1)}
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 text-white hover:bg-white/20 hover:text-white"
              onClick={onStop}
            >
              <X className="h-4 w-4" aria-hidden />
              {labels.stopSlides}
            </Button>
          </span>
        )}
      </div>
      <div className="relative min-h-0 w-full flex-1">
        <iframe
          key={src}
          src={src}
          title={slides.title}
          className="h-full w-full rounded-b-lg bg-white"
        />
      </div>
    </div>
  )
}
