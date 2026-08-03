// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/schools-scroll). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Schools header reveal — a faithful port of zenda.com's `schoolIntro`.
 *
 * Scrubbed over [school-wrap]: the location icon scales + rises in, then the
 * SCHOOLS tag, heading and paragraph stagger up after it.
 */
export function SchoolsScroll() {
  useEffect(() => {
    if (!document.querySelector("[school-wrap]")) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "[school-wrap]",
          start: "top 90%",
          end: "center 80%",
          scrub: true,
        },
      })
      tl.from("[school-icon]", {
        scale: 0.8,
        opacity: 0,
        y: "6rem",
        duration: 0.6,
        ease: "expo.inOut",
      })
      tl.from(
        "[school-element]",
        {
          opacity: 0,
          y: "6rem",
          duration: 0.8,
          ease: "power2.out",
          stagger: 0.2,
        },
        "-=0.4"
      )
    })

    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener("load", onLoad)
    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 600)

    return () => {
      window.removeEventListener("load", onLoad)
      window.clearTimeout(refreshTimer)
      ctx.revert()
    }
  }, [])

  return null
}
