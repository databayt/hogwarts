// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/rewards-scroll). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { MotionPathPlugin } from "gsap/MotionPathPlugin"
import { ScrollTrigger } from "gsap/ScrollTrigger"

/**
 * Scroll-driven Rewards section — a faithful port of zenda.com's `rewardsIntro`
 * and `rewardsProgress` timelines.
 *
 * `rewardsIntro` (scrubbed over [rewards-wrap]): the header reveals, and the
 * background blocks, gift-card images, spinning coins, coupon cards and the gift
 * all parallax up into place from far below.
 *
 * `rewardsProgress` (scrubbed over [rewards-progress-wrap]): the SVG curve draws
 * itself in (animating strokeDashoffset → 0) while the endpoint dot travels along
 * it via MotionPathPlugin.
 */
export function RewardsScroll() {
  useEffect(() => {
    if (!document.querySelector("[rewards-wrap]")) return
    // Reduced motion: leave the section in its settled state, no scroll motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger, MotionPathPlugin)

    const ctx = gsap.context(() => {
      // ---- rewardsIntro: header reveal + parallax rise ----
      const intro = gsap.timeline({
        scrollTrigger: {
          trigger: "[rewards-wrap]",
          start: "top 90%",
          end: "bottom 66%",
          scrub: 1,
        },
      })

      intro.from(
        "[rewards-element]",
        {
          y: "4rem",
          opacity: 0,
          duration: 0.4,
          ease: "power2.out",
          stagger: 0.15,
        },
        0
      )

      intro.from("[rewards-block-1]", { y: "42rem", duration: 0.8 }, 0)
      intro.from("[rewards-block-2]", { y: "36rem", duration: 0.8 }, "<")
      intro.from("[rewards-block-3]", { y: "40rem", duration: 0.8 }, "<")
      intro.from("[rewards-block-4]", { y: "38rem", duration: 0.8 }, "<")
      intro.from("[rewards-block-5]", { y: "30rem", duration: 0.8 }, "<")
      intro.from("[rewards-block-6]", { y: "20rem", duration: 0.8 }, "<")
      intro.from("[rewards-block-7]", { y: "28rem", duration: 0.8 }, "<")

      // The reference also flies in three gift-card images ([rewards-img-*])
      // and three brand coupons ([rewards-item-*]) here. Both sets of artwork
      // were removed from rewards.tsx -- real brands as reward partners on a
      // school's homepage -- so their tweens go with them. Don't re-add.
      intro.from(
        "[rewards-coin-1]",
        { y: "48rem", rotate: "-340deg", duration: 1.2 },
        0
      )
      intro.from(
        "[rewards-coin-2]",
        { y: "52rem", rotate: "380deg", duration: 1.2 },
        "<"
      )

      intro.from(
        "[rewards-gift]",
        { y: "-2rem", scale: 0.2, opacity: 0, duration: 0.8 },
        0.2
      )

      // ---- rewardsProgress: draw the curve + run the dot along it ----
      const path = document.getElementById("curve") as SVGPathElement | null
      const circle = document.getElementById(
        "endpoint"
      ) as SVGCircleElement | null
      if (path && circle) {
        const len = path.getTotalLength()
        path.style.strokeDasharray = String(len)
        path.style.strokeDashoffset = String(len)

        const progress = gsap.timeline({
          scrollTrigger: {
            trigger: "[rewards-progress-wrap]",
            start: "top 90%",
            end: "center 60%",
            scrub: 1,
          },
        })
        progress.to(path, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0)
        progress.to(
          circle,
          {
            motionPath: {
              path,
              align: path,
              alignOrigin: [0.5, 0.5],
              autoRotate: false,
              start: 0,
              end: 1,
            },
            ease: "none",
            duration: 1,
          },
          0
        )
      }
    })

    // Lazy images shift the section height; recompute trigger positions once settled.
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
