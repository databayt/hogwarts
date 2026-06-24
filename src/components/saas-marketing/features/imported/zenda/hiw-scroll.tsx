// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/hiw-scroll) — GSAP scroll behaviour for the
// "How it works" marquee. Runs under the `.zenda-clone` CSS scope.

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

export function HiwScroll() {
  useEffect(() => {
    if (!document.querySelector("[hiw-wrap]")) return

    gsap.registerPlugin(ScrollTrigger)
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const ctx = gsap.context(() => {
      // Continuous mobile marquees (two stacked copies → seamless loop).
      if (!reduce) {
        gsap.to("[m-marquee-track]", {
          y: "-100%",
          ease: "none",
          duration: 40,
          repeat: -1,
        })
        gsap.to("[m-marquee-track-reverse]", {
          y: "100%",
          ease: "none",
          duration: 40,
          repeat: -1,
        })
      }

      if (reduce) return

      // Header reveal.
      gsap.from("[hiw-element]", {
        scrollTrigger: {
          trigger: "[hiw-content-wrap]",
          start: "top 90%",
          end: "bottom 88%",
          scrub: 1,
        },
        opacity: 0,
        y: "6rem",
        duration: 0.8,
        ease: "power2.out",
        stagger: 0.2,
      })

      // Desktop column parallax.
      const wrap = document.querySelector("[hiw-marquee-wrap]")
      if (wrap) {
        const st = {
          trigger: wrap,
          start: "top 70%",
          end: "bottom 40%",
          scrub: 1,
        } as const
        gsap.fromTo(
          wrap.querySelectorAll('[hiw-marquee-track="up"]'),
          { y: "0%" },
          { y: "-68%", ease: "power2.out", scrollTrigger: st }
        )
        gsap.fromTo(
          wrap.querySelectorAll('[hiw-marquee-track="down"]'),
          { y: "4%" },
          { y: "78%", ease: "power2.out", scrollTrigger: st }
        )
      }

      // Stats grid reveal.
      const gridWrap = document.querySelector("[hiw-grid-wrap]")
      if (gridWrap) {
        gsap
          .timeline({
            scrollTrigger: {
              trigger: gridWrap,
              start: "top 76%",
              end: "bottom 50%",
              scrub: 1,
            },
          })
          .from(gridWrap.querySelectorAll("[hiw-grid-item]"), {
            opacity: 0,
            y: "60%",
            duration: 1,
            ease: "power2.out",
            stagger: 0.2,
          })
      }
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
