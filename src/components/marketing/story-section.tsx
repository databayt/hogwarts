"use client"

import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Icons } from '@/components/icons'
import { useVideoScrollControl } from "@/hooks/use-video-scroll-control"

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
            <div className="grid gap-8 lg:grid-cols-3 lg:gap-12 items-center">
                {/* Video - Left side (2/3 width) */}
                <div
                    ref={containerRef}
                    className="lg:col-span-2 relative rounded-lg overflow-hidden bg-[#2C2418]"
                >
                    <video
                        ref={videoRef}
                        className="w-full aspect-video object-cover"
                        loop
                        muted
                        playsInline
                    >
                        <source src="/story.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                </div>

                {/* Quote - Right side (1/3 width) */}
                <div className="flex flex-col items-start ps-4 lg:ps-8 pt-4 lg:pt-8">
                    <Icons.anthropicQuote className="size-10 md:size-12 text-foreground -ms-1" />
                    <p className="text-xl md:text-2xl lg:text-[1.75rem] font-medium leading-snug mt-3">
                        {dict.quote}
                    </p>
                </div>
            </div>
        </section>
    )
}
