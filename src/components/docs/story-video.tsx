"use client"

import { useVideoScrollControl } from "@/hooks/use-video-scroll-control"

export function StoryVideo() {
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
      >
        <source src="/story.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute end-4 bottom-4 flex items-center gap-2">
        <span className="text-sm font-medium text-white">hogwarts</span>
      </div>
    </div>
  )
}
