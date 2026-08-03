// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/features-scroll). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Scroll-driven assembly for the "You juggle life—we handle fees" section —
 * a faithful port of zenda.com's `featureHeader` + `sectionFeature` timelines.
 *
 * Both are `.from()` tweens scrubbed to the section's scroll progress, so as the
 * section travels up through the viewport:
 *   - the heading + paragraph rise and fade in,
 *   - the feature pills, which start scattered far out to the sides (and lifted,
 *     scaled, rotated), converge into their grid,
 *   - the phone mockup settles from scale 1.6 → 1 while its inner blocks slide in.
 *
 * Targets the same attributes the reference uses (`feature-element`,
 * `feature-left/right-N`, `feature-mockup`, `mockup-item-left/right-N`).
 */
export function FeaturesScroll() {
  useEffect(() => {
    if (!document.querySelector("[feature-wrap]")) return
    // Reduced motion: leave the grid in its settled (converged) state.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      // Heading + paragraph reveal.
      gsap
        .timeline({
          scrollTrigger: {
            trigger: "[feature-wrap]",
            start: "top 90%",
            end: "bottom 50%",
            scrub: 1,
          },
        })
        .from(
          "[feature-element]",
          {
            y: "8rem",
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            stagger: 0.15,
          },
          0
        )

      // Pills converge + phone settles + inner blocks slide in. Every tween starts
      // at 0 (via "<"); the differing durations stagger how much scroll each needs
      // to land, so outer pills trail the inner ones.
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "[feature-wrap]",
          start: "top 90%",
          end: "bottom 40%",
          scrub: 1,
        },
      })

      tl.from(
        "[feature-left-1]",
        {
          y: "-12rem",
          x: "-26rem",
          scale: 1.2,
          rotate: "-20deg",
          duration: 0.8,
        },
        0
      )
      tl.from(
        "[feature-left-2]",
        {
          y: "-4rem",
          x: "-28rem",
          scale: 1.15,
          rotate: "-8deg",
          duration: 0.9,
        },
        "<"
      )
      tl.from(
        "[feature-left-3]",
        {
          y: "-5rem",
          x: "-30rem",
          scale: 1.1,
          rotate: "-12deg",
          duration: 0.9,
        },
        "<"
      )
      tl.from(
        "[feature-left-4]",
        { y: "-3rem", x: "-34rem", scale: 1.25, rotate: "-6deg", duration: 1 },
        "<"
      )
      tl.from(
        "[feature-left-5]",
        { y: "-6rem", x: "-38rem", scale: 1.2, rotate: "-9deg", duration: 1 },
        "<"
      )
      tl.from(
        "[feature-left-6]",
        {
          y: "-5rem",
          x: "-40rem",
          scale: 1.18,
          rotate: "-7deg",
          duration: 1.2,
        },
        "<"
      )
      tl.from(
        "[feature-left-7]",
        {
          y: "-4rem",
          x: "-44rem",
          scale: 1.22,
          rotate: "-11deg",
          duration: 1.2,
        },
        "<"
      )
      tl.from(
        "[feature-left-8]",
        { y: "-3rem", x: "-46rem", scale: 1.1, rotate: "-5deg", duration: 1.2 },
        "<"
      )

      tl.from(
        "[feature-right-1]",
        { y: "-12rem", x: "26rem", scale: 1.2, rotate: "18deg", duration: 0.8 },
        0
      )
      tl.from(
        "[feature-right-2]",
        { y: "-4rem", x: "28rem", scale: 1.15, rotate: "8deg", duration: 0.9 },
        "<"
      )
      tl.from(
        "[feature-right-3]",
        { y: "-5rem", x: "30rem", scale: 1.1, rotate: "12deg", duration: 0.9 },
        "<"
      )
      tl.from(
        "[feature-right-4]",
        { y: "-3rem", x: "34rem", scale: 1.25, rotate: "6deg", duration: 1 },
        "<"
      )
      tl.from(
        "[feature-right-5]",
        { y: "-6rem", x: "38rem", scale: 1.2, rotate: "9deg", duration: 1 },
        "<"
      )
      tl.from(
        "[feature-right-6]",
        { y: "-5rem", x: "40rem", scale: 1.18, rotate: "7deg", duration: 1.2 },
        "<"
      )
      tl.from(
        "[feature-right-7]",
        { y: "-4rem", x: "44rem", scale: 1.22, rotate: "11deg", duration: 1.2 },
        "<"
      )
      tl.from(
        "[feature-right-8]",
        { y: "-3rem", x: "46rem", scale: 1.1, rotate: "5deg", duration: 1.2 },
        "<"
      )

      tl.from(
        "[feature-mockup]",
        { scale: 1.6, duration: 0.8, ease: "power2.out" },
        0
      )

      tl.from(
        "[mockup-item-left-1]",
        { x: "-18rem", scale: 1.2, duration: 1.2 },
        "<"
      )
      tl.from(
        "[mockup-item-left-2]",
        { x: "-20rem", scale: 1.1, duration: 1.2 },
        "<"
      )
      tl.from(
        "[mockup-item-left-3]",
        { x: "-24rem", scale: 1.15, duration: 1.2 },
        "<"
      )

      tl.from(
        "[mockup-item-right-1]",
        { x: "14rem", scale: 1.2, duration: 1.2 },
        "<"
      )
      tl.from(
        "[mockup-item-right-2]",
        { x: "18rem", scale: 1.1, duration: 1.2 },
        "<"
      )
      tl.from(
        "[mockup-item-right-3]",
        { x: "20rem", scale: 1.15, duration: 1.2 },
        "<"
      )
      tl.from(
        "[mockup-item-right-4]",
        { x: "24rem", scale: 1.1, duration: 1.2 },
        "<"
      )
    })

    // Lazy images change the section's height; recompute trigger positions once
    // everything has settled so start/end stay aligned.
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
