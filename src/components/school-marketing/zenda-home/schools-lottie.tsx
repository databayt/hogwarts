// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/schools-lottie). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect, useRef, useState } from "react"
import Lottie, { type LottieRefCurrentProps } from "lottie-react"

// The "Institutes" Lottie from zenda.com (Webflow embed: autoplay off, no loop).
// We mirror the Webflow behaviour — fetch the JSON (kept out of the JS bundle as a
// static asset) and play it once when it first scrolls into view.
export function InstitutesLottie() {
  const [data, setData] = useState<unknown>(null)
  const lottieRef = useRef<LottieRefCurrentProps | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const playedRef = useRef(false)

  useEffect(() => {
    let active = true
    fetch("/lottie/institutes.json")
      .then((r) => r.json())
      .then((d) => {
        if (active) setData(d)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!data || !el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !playedRef.current) {
            playedRef.current = true
            lottieRef.current?.goToAndPlay(0, true)
          }
        }
      },
      { threshold: 0.25 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [data])

  return (
    <div
      ref={containerRef}
      school-lottie=""
      className="schools_lottie-placeholder"
    >
      {data ? (
        <Lottie
          lottieRef={lottieRef}
          animationData={data}
          loop={false}
          autoplay={false}
          className="schools_lottie"
          style={{ width: "100%", aspectRatio: "2506 / 1496" }}
        />
      ) : null}
    </div>
  )
}
