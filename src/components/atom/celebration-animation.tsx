"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Celebration confetti — the shared success-moment animation. Used by the
// onboarding completion modal, the application-wizard success modal, and the
// admission offer header so every "you made it" surface reads the same.
//
// One Lottie JSON (confetti.json), fetched once per tab (module-level cache)
// and rendered through a deferred dynamic import so lottie-web stays out of the
// initial bundle. The sized wrapper always renders — the Lottie only mounts
// once the JSON arrives — so the layout never shifts on load. Decorative, so
// it's aria-hidden and honors prefers-reduced-motion.
import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const Lottie = dynamic(() => import("lottie-react"), { ssr: false })

const ANIMATION_URL = `https://${
  process.env.NEXT_PUBLIC_CDN_DOMAIN || "cdn.databayt.org"
}/hogwarts/animations/confetti.json`

// Module-level cache — one fetch per tab, shared across every mount.
let cached: object | null = null
let inflight: Promise<object | null> | null = null

function loadConfetti(): Promise<object | null> {
  if (cached) return Promise.resolve(cached)
  if (inflight) return inflight
  inflight = fetch(ANIMATION_URL)
    .then((res) => res.json())
    .then((data) => {
      cached = data
      return data as object
    })
    .catch(() => null)
  return inflight
}

// Warm the cache as soon as this module loads on the client, so the first
// success surface that mounts is already instant.
if (typeof window !== "undefined") void loadConfetti()

interface CelebrationAnimationProps {
  /** Sizing/spacing for the wrapper. Defaults to a centered 32×32 (h-32 w-32). */
  className?: string
}

export function CelebrationAnimation({ className }: CelebrationAnimationProps) {
  const reduce = useReducedMotion()
  // Seed from the module cache so a warm mount paints the animation on the very
  // first render — no blank frame, no pop-in.
  const [animationData, setAnimationData] = useState<object | null>(
    () => cached
  )

  useEffect(() => {
    if (animationData) return
    let cancelled = false
    loadConfetti().then((data) => {
      if (!cancelled && data) setAnimationData(data)
    })
    return () => {
      cancelled = true
    }
  }, [animationData])

  return (
    <div className={cn("mx-auto h-32 w-32", className)} aria-hidden="true">
      {animationData && (
        <Lottie
          animationData={animationData}
          loop={!reduce}
          autoplay={!reduce}
        />
      )}
    </div>
  )
}
