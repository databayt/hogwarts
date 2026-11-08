"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"

import { REVEAL_SPRING } from "@/components/saas-marketing/thmanyah/lib/fonts"

/**
 * «مرن» — the two display lines that stretch as they arrive, in our own
 * type. It replaces the reference's "Kashida" Lottie (a 2970x1060 drawing of
 * «مرن يمتد حسب تعبيرك.» whose letters lengthen): here the words are live
 * text in thmanyah serif display, so they read, translate and select.
 *
 * Arabic stretches the way Arabic does — with kashida. Every "ـ" in the copy
 * marks a joint that may lengthen; once the block is half in view the joints
 * grow one tatweel at a time, but only while the line still fits its box: a
 * line that would overflow stops one step back. English has no kashida, so
 * the same beat is tracking that opens out. Reduced motion shows the final
 * state at once.
 */

const MAX_STEPS = 5
const STEP_MS = 140

export function StretchWord({
  lines,
  rtl,
}: {
  lines: [string, string]
  rtl: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const reduced = useReducedMotion()
  const [steps, setSteps] = useState(0)

  /* Grow one tatweel per tick. Each tick first measures the line as the last
     step left it: if that step made a line overflow, it is undone and the
     growth stops there. Reduced motion runs the same loop at frame speed, so
     the final, fitted state still comes from the measurement. */
  useEffect(() => {
    if (!rtl || !inView) return
    const box = ref.current
    if (!box) return
    const delay = reduced ? 16 : STEP_MS
    let k = 0
    let id = 0
    const overflows = () =>
      [...box.querySelectorAll<HTMLElement>(".marn-line")].some(
        (line) => line.scrollWidth > line.clientWidth + 1
      )
    const tick = () => {
      if (overflows()) {
        setSteps(Math.max(0, k - 1))
        return
      }
      if (k >= MAX_STEPS) return
      k += 1
      setSteps(k)
      id = window.setTimeout(tick, delay)
    }
    id = window.setTimeout(tick, delay)
    return () => window.clearTimeout(id)
  }, [rtl, inView, reduced])

  const stretch = (line: string) =>
    rtl ? line.replaceAll("ـ", "ـ".repeat(1 + steps)) : line

  return (
    <div ref={ref} className="marn-words" dir={rtl ? "rtl" : "ltr"}>
      {lines.map((line, i) =>
        rtl ? (
          <p key={i} className="marn-line">
            {stretch(line)}
          </p>
        ) : (
          <motion.p
            key={i}
            className="marn-line"
            initial={reduced ? false : { letterSpacing: "-0.06em" }}
            animate={inView ? { letterSpacing: "0.01em" } : undefined}
            transition={{ ...REVEAL_SPRING, delay: i * 0.08 }}
          >
            {line}
          </motion.p>
        )
      )}
    </div>
  )
}
