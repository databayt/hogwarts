// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/work-scroll). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * About "What we do" heading reveal — a faithful port of zenda.com/about-us'
 * `#about-work-heading` timeline.
 *
 * The heading is pre-split into `.char` spans (see <Work/>). As the heading
 * travels up through the viewport, a scrubbed timeline fades each character from
 * grey (#9F9F9F) to its resting black, one after another left-to-right, so the
 * sentence "fills in" as you read down it. Reference params: start "top 70%",
 * end "bottom 55%", scrub 0.1, per-char duration 0.2 (≡ stagger 0.2).
 */
export function AboutWorkScroll() {
  useEffect(() => {
    const heading = document.querySelector("[about-work-heading]")
    if (!heading) return

    // Reduced motion / no animation: leave the characters in their resting
    // black state (their CSS default) — nothing to do.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const chars = gsap.utils.toArray<HTMLElement>(
        "[about-work-heading] .char"
      )
      if (!chars.length) return

      gsap
        .timeline({
          scrollTrigger: {
            trigger: "[about-work-heading]",
            start: "top 70%",
            end: "bottom 55%",
            scrub: 0.1,
          },
        })
        // Sequential per-char (duration 0.2, no overlap) === stagger 0.2.
        .from(chars, {
          color: "#9F9F9F",
          duration: 0.2,
          stagger: 0.2,
          ease: "none",
        })
    })

    return () => ctx.revert()
  }, [])

  return null
}
