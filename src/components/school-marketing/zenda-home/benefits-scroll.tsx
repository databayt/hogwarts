// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/benefits-scroll). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { mx } from "../shared/rtl-motion"

/**
 * Benefits "Discounts for everything school related" reveal — a faithful port of
 * zenda.com's `benefitsIntro`. Everything is scrubbed across [benefits-wrap]
 * (start "top 60%" → end "bottom 64%") and starts at time 0, so the whole
 * tableau assembles together:
 *  - the left card slides in from the left while its gift scales down from 1.3,
 *    the heading rises, and the two coins drop in and spin to rest,
 *  - the right cards slide in from the right (staggered): the dark "Set by your
 *    school" card — its heading + three stars trailing progressively
 *    further right — then the pill list whose items stagger in from the right.
 */
export function BenefitsScroll() {
  useEffect(() => {
    const wrap = document.querySelector("[benefits-wrap]")
    if (!wrap) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    gsap.registerPlugin(ScrollTrigger)

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrap,
          start: "top 60%",
          end: "bottom 64%",
          scrub: 1,
        },
      })

      tl.from(
        wrap.querySelector("[benefits-block-left]"),
        { x: mx("-20%"), opacity: 0, duration: 1, ease: "power2.out" },
        0
      )
      tl.from(
        wrap.querySelectorAll("[benefits-block-right]"),
        {
          x: mx("20%"),
          opacity: 0,
          duration: 1,
          ease: "power2.out",
          stagger: 0.2,
        },
        0
      )
      tl.from(
        wrap.querySelector("[benefits-gift-img]"),
        { scale: 1.3, opacity: 0, duration: 1, ease: "power2.out" },
        0
      )
      tl.from(
        wrap.querySelector("[benefits-coin-1]"),
        {
          y: "6rem",
          rotate: "120deg",
          opacity: 0,
          duration: 1,
          ease: "power2.out",
        },
        0.1
      )
      tl.from(
        wrap.querySelector("[benefits-coin-2]"),
        {
          y: "4rem",
          rotate: "-160deg",
          opacity: 0,
          duration: 1,
          ease: "power2.out",
        },
        0.1
      )
      tl.from(
        wrap.querySelector("[benefits-heading]"),
        { y: "6rem", opacity: 0, duration: 1, ease: "power2.out" },
        0
      )
      tl.from(
        wrap.querySelector("[benefits-heading-right]"),
        { x: mx("40%"), opacity: 0, duration: 1, ease: "power2.out" },
        0
      )
      tl.from(
        wrap.querySelector("[benefits-star-1]"),
        { x: mx("40%"), opacity: 0, duration: 1, ease: "power2.out" },
        0
      )
      tl.from(
        wrap.querySelector("[benefits-star-2]"),
        { x: mx("80%"), opacity: 0, duration: 1, ease: "power2.out" },
        0
      )
      tl.from(
        wrap.querySelector("[benefits-star-3]"),
        { x: mx("120%"), opacity: 0, duration: 1, ease: "power2.out" },
        0
      )
      tl.from(
        wrap.querySelectorAll("[benefits-item]"),
        {
          x: mx("20%"),
          opacity: 0,
          duration: 1,
          ease: "power2.out",
          stagger: 0.2,
        },
        0
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
