"use client"

import React, { useEffect, useRef } from "react"
import lottie, { AnimationItem } from "lottie-web"

import { cn } from "@/lib/utils"

interface LottiePlayerProps {
  src: string
  className?: string
  loop?: boolean
  autoplay?: boolean
  /**
   * Defer playback until the mount first enters the viewport, then play
   * exactly as configured (with loop=false: once, holding the last frame).
   * Mirrors Framer's viewport-triggered Lottie — the reference's MARN
   * kashida plays a single pass when scrolled into view and freezes.
   */
  playOnView?: boolean
  /**
   * SVG preserveAspectRatio. The reference (font.thmanyah.com) renders every
   * Lottie with "xMidYMid slice" — fill the box and crop the overflow — while
   * lottie-web defaults to "xMidYMid meet", which letterboxes instead. Keep
   * slice so panels fill edge-to-edge at non-16:9 viewports.
   */
  preserveAspectRatio?: string
}

export function LottiePlayer({
  src,
  className,
  loop = true,
  autoplay = true,
  playOnView = false,
  preserveAspectRatio = "xMidYMid slice",
}: LottiePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let isMounted = true
    let entered = false
    let observer: IntersectionObserver | null = null

    if (playOnView) {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          entered = true
          animRef.current?.play()
          observer?.disconnect()
        }
      })
      observer.observe(containerRef.current)
    }

    // Load animation
    fetch(src)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !containerRef.current) return
        if (animRef.current) {
          animRef.current.destroy()
        }
        animRef.current = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop,
          // With playOnView the animation waits, then plays on first entry.
          autoplay: playOnView ? false : autoplay,
          animationData: data,
          rendererSettings: { preserveAspectRatio },
        })
        if (playOnView && entered) {
          animRef.current.play()
        }
      })
      .catch((err) => {
        console.error("Failed to load Lottie animation:", err)
      })

    return () => {
      isMounted = false
      observer?.disconnect()
      if (animRef.current) {
        animRef.current.destroy()
      }
    }
  }, [src, loop, autoplay, playOnView, preserveAspectRatio])

  /* `lottie-mount` keeps the rendered <svg> inline (Tailwind's preflight makes
     svg display:block). The reference's Lottie svgs are inline and sit on a
     12px sans-serif line box, so a Lottie in a height:auto container is its
     intrinsic height + a 3px baseline gap — a gap several reference tile
     heights are built on. */
  return (
    <div
      ref={containerRef}
      className={cn("lottie-mount h-full w-full", className)}
    />
  )
}
