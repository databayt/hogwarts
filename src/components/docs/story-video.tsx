"use client"

import { useVideoScrollControl } from "@/hooks/use-video-scroll-control"

export function StoryVideo() {
  const { containerRef, videoRef } = useVideoScrollControl({
    threshold: 0.3,
    targetVolume: 0, // Keep muted for docs
  })

  return (
    <div
      ref={containerRef}
      className="mt-8 mb-8 relative aspect-video w-full max-w-3xl mx-auto rounded-sm overflow-hidden bg-black/5"
    >
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src="/story.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="absolute inset-0 bg-black/10" />

      <div className="absolute bottom-4 end-4 flex items-center gap-2">
        <span className="text-white text-sm font-medium">hogwarts</span>
      </div>
    </div>
  )
}
