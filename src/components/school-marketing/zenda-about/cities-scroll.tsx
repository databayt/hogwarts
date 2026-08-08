// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/cities-scroll). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { mx, rtlSign } from "../shared/rtl-motion"

/**
 * "Our Growth Journey" timeline reveal — a faithful port of zenda.com/about-us'
 * `aboutCitiesIntro`.
 *
 * A one-shot timeline (plays once when the list hits "top 60%"). For each row,
 * staggered 0.3s apart: the white year pill sweeps in from the left as a beige
 * bar and settles white on the right, while the row's content fades and slides
 * in from x:8%. The content tween overlaps the block tween a touch more on each
 * successive row (`-=${0.8 - i*0.1}`), matching the reference's cascade.
 */
export function AboutCitiesScroll() {
  useEffect(() => {
    const trigger = document.querySelector("[about-cities-wrap]")
    if (!trigger) return

    // Reduced motion: leave every row in its settled state (content visible,
    // year pills white on the right) — nothing to animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>("[about-cities-item]")
      if (!items.length) return

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: "top 60%",
          toggleActions: "play none none none",
        },
      })

      items.forEach((item, i) => {
        const block = item.querySelector("[about-cities-block]")
        const content = item.querySelector("[about-cities-content]")
        if (!block || !content) return

        // The pill settles on the END side (`inset-inline: auto 0`), and this
        // sweeps it in from the START side. Both edges are named physically
        // because GSAP writes them as physical CSS, so they have to be swapped
        // by hand under RTL -- left unflipped, the "from" state would be the
        // side the pill already settles on and the sweep would not happen at
        // all. `mx()` cannot help here: it mirrors a translate offset, and this
        // animates the inset edges themselves.
        const startEdge = rtlSign() === -1 ? "right" : "left"
        const endEdge = rtlSign() === -1 ? "left" : "right"
        tl.from(
          block,
          {
            [endEdge]: "auto",
            [startEdge]: "0%",
            backgroundColor: "#F4F2EC",
            duration: 1,
            ease: "power2.out",
          },
          i * 0.3 // manual stagger
        )
        tl.from(
          content,
          { opacity: 0, x: mx("8%"), duration: 0.6, ease: "power2.out" },
          `-=${0.8 - i * 0.1}` // overlap a touch more each row
        )
      })
    })

    return () => ctx.revert()
  }, [])

  return null
}
