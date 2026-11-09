"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"
import type { VideoMedia } from "@/components/docs/media"

interface HeroVideoProps {
  /** One manifest entry, resolved on the server (`featureVideo`). */
  video: VideoMedia
  label: string
  className?: string
  /** A header sits on top: fade the top edge into the page background so
   *  its links stay readable over a bright frame, in either theme. */
  scrim?: boolean
}

/**
 * A chrome-less muted loop that covers whatever box the caller sizes
 * (`className`). Clips are 1920x1080 with their action in the centre strip,
 * so a 16:9 box shows all of it and a wider band crops only the margins.
 * Plays only while on screen; with reduced motion it stays on its poster.
 */
export function HeroVideo({ video, label, className, scrim }: HeroVideoProps) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) el.play().catch(() => {})
        else el.pause()
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={cn("bg-muted relative overflow-hidden", className)}>
      <video
        ref={ref}
        className="absolute inset-0 size-full object-cover"
        muted
        loop
        playsInline
        preload="metadata"
        poster={video.poster}
        aria-label={label}
      >
        {video.sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
      </video>
      {scrim && (
        <div
          aria-hidden
          className="from-background/90 via-background/60 md:via-background/40 pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b to-transparent md:h-32"
        />
      )}
    </div>
  )
}
