"use client"

import { useVideoScrollControl } from "@/hooks/use-video-scroll-control"
import { Icons } from "@/components/icons"
import type { Dictionary } from "@/components/internationalization/dictionaries"

interface StorySectionProps {
  dictionary?: Dictionary
}

export default function StorySection({ dictionary }: StorySectionProps) {
  const { containerRef, videoRef } = useVideoScrollControl({
    threshold: 0.4,
    fadeInDuration: 600,
    fadeOutDuration: 300,
    targetVolume: 0.7,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dict = (dictionary?.marketing as any)?.storySection || {
    quote: "When schools automate the mundane, what do educators focus on?",
  }

  return (
    <section className="py-16 md:py-24">
      <div className="grid items-center gap-8 lg:grid-cols-3 lg:gap-12">
        {/* Video - Left side (2/3 width) */}
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-lg bg-[#2C2418] lg:col-span-2"
        >
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            loop
            muted
            playsInline
          >
            <source src="/story.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Quote - Right side (1/3 width) */}
        <div className="flex flex-col items-start ps-4 pt-4 lg:ps-8 lg:pt-8">
          <Icons.anthropicQuote className="text-foreground -ms-1 size-10 md:size-12" />
          <p className="mt-3 text-xl leading-snug font-medium md:text-2xl lg:text-[1.75rem]">
            {dict.quote}
          </p>
        </div>
      </div>
    </section>
  )
}
