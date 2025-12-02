"use client"

import { useEffect, useRef, useState } from "react"
import type { Dictionary } from '@/components/internationalization/dictionaries'

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
                <div className="flex flex-col gap-4">
                    <svg className="w-10 h-10 text-muted-foreground/40" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                    </svg>
                    <p className="text-lg md:text-xl lg:text-2xl font-medium leading-relaxed">
                        {dict.quote}
                    </p>
                </div>
            </div>
        </section>
    )
}
