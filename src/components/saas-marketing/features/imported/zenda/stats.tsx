// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (for-schools/stats) — scroll-triggered count-up of
// the parent-research figures. Runs under the `.zenda-clone` CSS scope.

"use client"

import { useEffect, useRef, useState } from "react"

type Stat = { value: number; suffix: string; label: string }

const STATS: Stat[] = [
  {
    value: 61,
    suffix: "%",
    label:
      "parents prefer the flexibility to defer school fee payments by a few months.",
  },
  {
    value: 75,
    suffix: "%",
    label: "parents want to pay fees digitally, from their homes or workplaces",
  },
  {
    value: 71,
    suffix: "%",
    label: "parents agree that digital fee payment systems are more efficient",
  },
]

const DURATION = 1500
const STAGGER = 140
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function StatItem({
  stat,
  index,
  play,
}: {
  stat: Stat
  index: number
  play: boolean
}) {
  const [n, setN] = useState(stat.value)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- arm to 0 below the fold for the count-up
    setN(0)
  }, [])

  useEffect(() => {
    if (!play) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion shows the final figure
      setN(stat.value)
      return
    }
    let raf = 0
    let startTs = 0
    const delay = index * STAGGER
    const tick = (ts: number) => {
      if (!startTs) startTs = ts + delay
      const elapsed = ts - startTs
      if (elapsed <= 0) {
        raf = requestAnimationFrame(tick)
        return
      }
      const p = Math.min(1, elapsed / DURATION)
      setN(Math.round(easeOutCubic(p) * stat.value))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [play, stat.value, index])

  const variant = index === 1 ? " is-second" : index === 2 ? " is-third" : ""
  return (
    <div className={`stats_item${variant}`}>
      <h2 className="stats_numbers">
        {n}
        {stat.suffix}
      </h2>
      <p className="heading-style-h4 text-color-grey">{stat.label}</p>
    </div>
  )
}

export function Stats() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [play, setPlay] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    if (typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no IO: play immediately
      setPlay(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setPlay(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <section className="section_stats">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div ref={wrapRef} className="stats_wrap">
            {STATS.map((s, i) => (
              <StatItem key={s.label} stat={s} index={i} play={play} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
