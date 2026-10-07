"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useVideoScrollControl } from "@/hooks/use-video-scroll-control"

import type { VideoMedia } from "./media"

// `video` is the manifest entry, read server-side in mdx-components.tsx so the
// manifest itself stays out of this client bundle.
export function StoryVideo({ video }: { video: VideoMedia }) {
  const { containerRef, videoRef } = useVideoScrollControl({
    playThreshold: 0.3,
    targetVolume: 0, // Keep muted for docs
    progressiveVolume: false,
  })

  return (
    <div
      ref={containerRef}
      className="relative mx-auto mt-8 mb-8 aspect-video w-full max-w-3xl overflow-hidden rounded-sm bg-black/5"
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        poster={video.poster}
      >
        {video.sources.map((source) => (
          <source key={source.src} src={source.src} type={source.type} />
        ))}
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute end-4 bottom-4 flex items-center gap-2">
        <span className="text-sm font-medium text-white">balqalam</span>
      </div>
    </div>
  )
}
