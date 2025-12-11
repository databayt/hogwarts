"use client"

import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Icons } from '@/components/icons'
import { useVideoScrollControl } from "@/hooks/use-video-scroll-control"
import { Volume2, VolumeX } from "lucide-react"

interface StorySectionProps {
    dictionary?: Dictionary
}

export default function StorySection({ dictionary }: StorySectionProps) {
    const { containerRef, videoRef, isMuted, toggleMute, isInView } = useVideoScrollControl({
        threshold: 0.3, // Start playing when 30% visible
        autoPause: true, // Pause when out of view
        enableAudio: true, // Enable audio control
        fadeInDuration: 800, // Smooth fade in
        fadeOutDuration: 400, // Quick fade out
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
                    className="lg:col-span-2 relative rounded-lg overflow-hidden bg-[#2C2418] group"
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

                    {/* Mute/Unmute Button - appears when video is in view */}
                    <button
                        onClick={toggleMute}
                        className={`
                            absolute bottom-4 right-4
                            p-3 rounded-full
                            bg-black/60 hover:bg-black/80
                            text-white
                            transition-all duration-300
                            ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
                            group-hover:opacity-100
                            focus:outline-none focus:ring-2 focus:ring-white/50
                        `}
                        aria-label={isMuted ? "Unmute video" : "Mute video"}
                    >
                        {isMuted ? (
                            <VolumeX className="size-5" />
                        ) : (
                            <Volume2 className="size-5" />
                        )}
                    </button>

                    {/* Click to unmute hint - shows only when muted and in view */}
                    {isMuted && isInView && (
                        <div
                            className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-black/60 text-white text-sm flex items-center gap-2 animate-pulse cursor-pointer"
                            onClick={toggleMute}
                        >
                            <VolumeX className="size-4" />
                            <span>Click to unmute</span>
                        </div>
                    )}
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
