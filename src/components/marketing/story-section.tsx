"use client"

import { useEffect, useRef, useState } from "react"
import type { Dictionary } from '@/components/internationalization/dictionaries'
import { Icons } from '@/components/icons'

interface StorySectionProps {
    dictionary?: Dictionary
}

export default function StorySection({ dictionary }: StorySectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isInView, setIsInView] = useState(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dict = (dictionary?.marketing as any)?.storySection || {
        quote: "When schools automate the mundane, what do educators focus on?",
    }

    // Intersection Observer for auto-play based on visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting)
            },
            { threshold: 0.5 }
        )

        if (containerRef.current) {
            observer.observe(containerRef.current)
        }

        return () => observer.disconnect()
    }, [])

    // Auto-play when in view
    useEffect(() => {
        if (videoRef.current && isInView) {
            videoRef.current.play()
        }
    }, [isInView])

    return (
        <section ref={containerRef} className="py-16 md:py-24">
            <div className="grid gap-8 lg:grid-cols-3 lg:gap-12 items-center">
                {/* Video - Left side (2/3 width) */}
                <div className="lg:col-span-2 relative rounded-lg overflow-hidden bg-[#2C2418]">
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
                <div className="flex flex-col">
                    <Icons.anthropicQuote className="size-16 md:size-20 text-foreground" />
                    <p className="text-xl md:text-2xl lg:text-[1.75rem] font-medium leading-snug mt-6">
                        {dict.quote}
                    </p>
                </div>
            </div>
        </section>
    )
}
