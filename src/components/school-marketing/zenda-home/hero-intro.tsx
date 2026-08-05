// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/hero-intro). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

"use client"

import { useEffect } from "react"
import { gsap } from "gsap"

/**
 * Home hero intro — a faithful port of zenda.com's GSAP `heroLoad` timeline.
 *
 * Choreography (desktop):
 *   1. The page holds for ~1.8s with the logo and the 3D video stacked dead-center
 *      (the logo sits at x:318% of its width ≈ viewport centre; the video sits at
 *      x:-32% scaled to 1.4 ≈ viewport centre).
 *   2. The logo slides out to the top-left corner while the video slides to the
 *      right and scales back down to 1.
 *   3. The nav links fade in, and the heading / paragraph / button slide in from
 *      the right — overlapping the split so they "come in" as the pieces settle.
 *
 * Mobile drops the centre-split (the layout is stacked) and just slides the
 * heading, paragraph, button and video in from the right.
 *
 * This component renders nothing; it drives elements the markup tags with the
 * `hero-logo` / `hero-link` / `hero-element` / `hero-btn` / `hero-video`
 * attributes — the same selectors the reference site uses — so the logo (in the
 * Header) and the hero (in Hero) animate as one coordinated timeline.
 */
export function HeroIntro() {
  useEffect(() => {
    // Clear the gate the page renders (`.page-wrapper{opacity:0}`) so the
    // settled layout never paints before the timeline stages its first frame.
    // Inline style, so it beats the stylesheet rule on specificity.
    const reveal = () => {
      const wrapper = document.querySelector<HTMLElement>(".page-wrapper")
      if (wrapper) wrapper.style.opacity = "1"
    }

    // The reference has only a <noscript> guard, which covers JS being off but
    // not JS being broken. This is a school's public homepage: if anything below
    // throws, a visitor should still get the page rather than a blank screen.
    const failsafe = window.setTimeout(reveal, 2500)

    // Honour reduced-motion: skip the intro and show the settled hero.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.clearTimeout(failsafe)
      reveal()
      return
    }

    // Safe to reveal before building the timeline: `.from()` stages its start
    // values synchronously on creation, so no paint happens in between.
    reveal()

    const ctx = gsap.context(() => {
      if (window.innerWidth > 991) {
        // ---------- Desktop: centred hold → split → reveal ----------
        const heroLogo = document.querySelector("[hero-logo]")
        const heroVideo = document.querySelector("[hero-video]")
        const heroLinks = gsap.utils.toArray<HTMLElement>("[hero-link]")
        const heroElements = gsap.utils.toArray<HTMLElement>("[hero-element]")
        const heroBtn = gsap.utils.toArray<HTMLElement>("[hero-btn]")

        if (
          !heroLogo ||
          !heroVideo ||
          !heroLinks.length ||
          !heroElements.length
        )
          return

        const tl = gsap.timeline({
          defaults: { ease: "power2.out", duration: 1 },
        })

        // Hold for 1.8s, then move the logo from centre to its corner.
        //
        // The reference hardcodes `x: "318%"`, which is a percentage of the
        // element's OWN width -- 318% of its 173px wordmark happens to land it
        // dead centre at any viewport. Our logo is a small mark plus the school
        // name, so the same 318% left it ~300px short of centre and the splash
        // read as off-balance. Measuring the distance keeps the choreography
        // the reference intended whatever the logo turns out to be.
        const logoRect = heroLogo.getBoundingClientRect()
        const logoToCentre =
          window.innerWidth / 2 - (logoRect.left + logoRect.width / 2)
        tl.from(heroLogo, { x: logoToCentre, duration: 0.8 }, 1.8)
        // ...and the video from centre (scaled up) out to the right.
        tl.from(heroVideo, { x: "-32%", scale: 1.4, duration: 0.8 }, 1.8)
        // Nav links fade in, staggered, finishing as the split lands.
        tl.fromTo(
          heroLinks,
          { opacity: 0 },
          { opacity: 1, stagger: 0.15, duration: 0.6 },
          ">-.8"
        )
        // Heading + paragraph slide in from the right.
        tl.from(
          heroElements,
          { x: "40%", opacity: 0, stagger: 0.18, duration: 0.8 },
          "<"
        )
        // Button trails just behind the text.
        tl.from(heroBtn, { x: "30%", opacity: 0, duration: 0.8 }, "<.2")
      } else {
        // ---------- Mobile: staggered slide-in from the right ----------
        const heroElements = gsap.utils.toArray<HTMLElement>("[hero-element]")
        const heroBtn = gsap.utils.toArray<HTMLElement>("[hero-btn]")
        const heroVideo = document.querySelector("[hero-video]")

        const tl = gsap.timeline({
          defaults: { ease: "power2.out", duration: 1 },
        })

        tl.from(
          heroElements,
          { x: "4rem", opacity: 0, stagger: 0.18, duration: 1.2 },
          0
        )
        tl.from(heroBtn, { x: "4rem", opacity: 0, duration: 0.8 }, "<.4")
        tl.from(heroVideo, { x: "4rem", opacity: 0, duration: 0.8 }, "<.2")
      }
    })

    return () => {
      window.clearTimeout(failsafe)
      ctx.revert()
    }
  }, [])

  return null
}
