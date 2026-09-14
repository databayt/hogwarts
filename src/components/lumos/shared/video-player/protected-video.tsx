"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef } from "react"

import { cn } from "@/lib/utils"

import { useVideoProtection } from "./hooks/use-video-protection"
import { VideoWatermark } from "./video-watermark"

interface ProtectedVideoProps {
  /** A protected reference (`/api/lumos/video/<id>`) or a signed URL. */
  src: string
  /** Who is watching — the watermark's identity. */
  viewer?: { id?: string; email?: string | null }
  onError?: () => void
  autoPlay?: boolean
  className?: string
}

/**
 * The small in-page player for protected media that is not a lesson: a live
 * class recording, a submission preview. Native controls, but watched in the
 * app and never saved — no download control, no picture-in-picture or casting
 * (both leave the watermark behind), the keyboard save paths closed, a blank
 * frame after PrintScreen, a pause when the tab hides, and the two-layer
 * forensic watermark.
 *
 * It exists so a protected video never has to be opened in its own tab: the
 * video route refuses a page navigation, because a tab is the browser's bare
 * player with a Download button.
 */
export function ProtectedVideo({
  src,
  viewer,
  onError,
  autoPlay,
  className,
}: ProtectedVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useVideoProtection({ containerRef, videoRef })

  return (
    <div
      ref={containerRef}
      data-video-protected
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-md bg-black select-none",
        className
      )}
    >
      <video
        ref={videoRef}
        controls
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        playsInline
        autoPlay={autoPlay}
        src={src}
        onError={onError}
        onDragStart={(e) => e.preventDefault()}
        className="h-full w-full"
      />
      {viewer?.id && (
        <VideoWatermark
          userId={viewer.id}
          userEmail={viewer.email ?? undefined}
        />
      )}
    </div>
  )
}
