"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import Lottie from "lottie-react"
import { createPortal } from "react-dom"

/*
 * The building. zenda's /for-schools hero centres a line-drawn school
 * illustration -- gold four-point stars floating around it -- and then flies it
 * down the page as you scroll until it settles into the image slot of the white
 * intro card below. Two things are happening at once and it is worth keeping
 * them apart:
 *
 *   1. The ENTRANCE. The art scales 1.3 -> 1 and fades in at 1.85s, after the
 *      headline words have converged. It is the last thing to arrive.
 *   2. The MERGE. A fixed copy of the box lerps its left/top/width/height from
 *      the hero placeholder's live rect to the card slot's live rect, driven by
 *      scroll position. Sizing the box directly (rather than transforming it)
 *      is what lets the aspect change from the hero's 2:1 letterbox to the
 *      card's 3:2 slot without the drawing distorting.
 *
 * Why the flyer is portalled to <body>: the hero section carries `overflow:
 * clip` to contain the headline's scattered start positions, and the intro card
 * sits inside a stacking context of its own. A `position: fixed` child of
 * either can be clipped or, if an ancestor ever gains a transform, trapped. The
 * reference sidesteps this by rendering the overlay at the top of its page
 * component; a portal is the same trick without making the caller's tree carry
 * a detail that is nobody else's business.
 *
 * Under `prefers-reduced-motion` there is no flyer and no merge at all: the
 * illustration simply renders in the hero and the card slot stays empty. A
 * scroll-linked object crossing the whole viewport is exactly the kind of
 * motion the preference is asking us not to make.
 */

const ART_URL = "/lottie/school-header.json"

/** The building lands a little smaller than the slot and grounded at its foot,
 *  so it reads as sitting IN the card rather than filling it. zenda's numbers. */
const SHRINK = 0.85
const EXTRA_DROP = 14

function useArtData() {
  const [data, setData] = useState<unknown>(null)
  useEffect(() => {
    let live = true
    fetch(ART_URL)
      .then((r) => r.json())
      .then((json) => {
        if (live) setData(json)
      })
      .catch(() => {})
    return () => {
      live = false
    }
  }, [])
  return data
}

function Art({ data }: { data: unknown }) {
  if (!data) return null
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Lottie animationData={data as any} loop={false} autoplay />
  )
}

export function AcademicHeroArt() {
  const reduced = useReducedMotion()
  const slotRef = useRef<HTMLDivElement>(null)
  const flyerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const data = useArtData()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (reduced) return
    const slot = slotRef.current
    const flyer = flyerRef.current
    if (!slot || !flyer) return

    const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    // The page rests one nav-height down (see the tuck in zenda-nav/header.tsx),
    // so scroll progress is measured from there, not from 0.
    const navHeight = () =>
      (document.querySelector(".nav_component") as HTMLElement | null)
        ?.offsetHeight ?? 85

    let rest = navHeight()
    let distance = 1000

    const calibrate = () => {
      rest = navHeight()
      const target = document.querySelector("[data-hero-art-target]")
      if (!target) return
      const targetDocTop = target.getBoundingClientRect().top + window.scrollY
      // Finish once the slot has risen to ~45% of the viewport, so the building
      // arrives before the card's copy is being read rather than after.
      distance = Math.max(300, targetDocTop - 0.45 * window.innerHeight - rest)
    }

    let raf = 0
    const frame = () => {
      const target = document.querySelector("[data-hero-art-target]")
      const from = slot.getBoundingClientRect()
      let tLeft = from.left
      let tTop = from.top
      let tW = from.width
      let tH = from.height
      if (target) {
        const to = target.getBoundingClientRect()
        tW = to.width * SHRINK
        tH = to.height * SHRINK
        tLeft = to.left + (to.width - tW) / 2
        tTop = to.top + (to.height - tH) + EXTRA_DROP
      }
      const raw = clamp01((window.scrollY - rest) / distance)
      const e = Math.pow(raw, 1.5) // quicker ramp toward the merge
      flyer.style.left = `${lerp(from.left, tLeft, e)}px`
      flyer.style.top = `${lerp(from.top, tTop, e)}px`
      flyer.style.width = `${lerp(from.width, tW, e)}px`
      flyer.style.height = `${lerp(from.height, tH, e)}px`
      raf = requestAnimationFrame(frame)
    }

    calibrate()
    // Re-measure once fonts and the illustration have settled -- the card below
    // moves as the page reflows, and a stale target top makes the merge finish
    // early or never.
    const settle = window.setTimeout(calibrate, 400)
    window.addEventListener("resize", calibrate, { passive: true })
    // Continuous rAF rather than a scroll listener: the placeholder itself is
    // still moving during the hero's entrance, so the flyer has to be
    // repositioned every frame, not only when the scroll position changes.
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(settle)
      window.removeEventListener("resize", calibrate)
    }
  }, [reduced, data])

  // Reduced motion: the art stays where it is, in the hero, and never flies.
  if (reduced) {
    return (
      <div className="hero-art_slot" aria-hidden="true">
        <div className="hero-art_box">
          <div className="hero-art_inner">
            <Art data={data} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Reserves the building's box in the hero flow. Stays empty -- the
       * visible copy is the portalled flyer, which starts life exactly here. */}
      <div ref={slotRef} className="hero-art_slot" aria-hidden="true" />

      {mounted &&
        createPortal(
          <div ref={flyerRef} className="hero-art_flyer" aria-hidden="true">
            <div className="hero-art_box">
              <motion.div
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  duration: 1.1,
                  ease: [0.33, 1, 0.68, 1],
                  delay: 1.85,
                }}
                className="hero-art_inner"
              >
                <Art data={data} />
              </motion.div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
