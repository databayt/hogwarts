"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"
import { Play } from "lucide-react"

import { ProtectedVideo } from "@/components/lumos/shared/video-player/protected-video"

interface Props {
  src: string
  viewer?: { id: string; email?: string | null }
  label: string
}

/**
 * The status feed's preview: a button until pressed, then the protected
 * player in place. Mounted on demand so a feed of a hundred submissions does
 * not open a hundred media requests.
 */
export function VideoPreview({ src, viewer, label }: Props) {
  const [open, setOpen] = useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
      >
        <Play className="size-3" />
        {label}
      </button>
    )
  }

  return <ProtectedVideo src={src} viewer={viewer} autoPlay className="max-w-xl" />
}
