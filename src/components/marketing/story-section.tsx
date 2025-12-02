"use client"

import { useEffect, useRef, useState } from "react"
import { Play } from "lucide-react"
import type { Dictionary } from '@/components/internationalization/dictionaries'

interface StorySectionProps {
    dictionary?: Dictionary
}

export default function StorySection({ dictionary }: StorySectionProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isInView, setIsInView] = useState(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dict = (dictionary?.marketing as any)?.storySection || {
        title: "Building the future of education",
        quote: "What if schools could focus on teaching instead of paperwork? What would education look like then?",
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
        if (videoRef.current && isInView && !isPlaying) {
            videoRef.current.play()
            setIsPlaying(true)
        }
    }, [isInView, isPlaying])

    const handlePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause()
            } else {
                videoRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    return (
        <section ref={containerRef} className="py-16 md:py-24">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
                {/* Video - Left side */}
                <div className="relative rounded-lg overflow-hidden bg-[#2C2418]">
                    <video
                        ref={videoRef}
                        className="w-full aspect-[4/3] object-cover"
                        loop
                        muted
                        playsInline
                    >
                        <source src="/story.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>

                    {/* Title overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                        <h3 className="text-white text-2xl md:text-3xl font-medium leading-tight">
                            {dict.title}
                        </h3>
                    </div>

                    {/* Play button */}
                    <button
                        onClick={handlePlay}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/90 hover:bg-white flex items-center justify-center transition-colors"
                        aria-label={isPlaying ? "Pause video" : "Play video"}
                    >
                        <Play className="w-6 h-6 text-[#2C2418] ml-1" fill="currentColor" />
                    </button>
                </div>

                {/* Quote - Right side */}
                <div className="flex items-start gap-4">
                    <span className="text-6xl md:text-7xl font-serif text-muted-foreground/30 leading-none">"</span>
                    <p className="text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed pt-4">
                        {dict.quote}
                    </p>
                </div>
            </div>
        </section>
    )
}
