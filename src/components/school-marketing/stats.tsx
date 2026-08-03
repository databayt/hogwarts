"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"

import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import SectionHeading from "../atom/section-heading"
import { formatNumber } from "./format"

interface Stat {
  value: number
  suffix: string
  label: string
}

const DURATION = 1500
const STAGGER = 140
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

function StatItem({
  stat,
  index,
  play,
  locale,
}: {
  stat: Stat
  index: number
  play: boolean
  locale: string
}) {
  // Starts at the final figure so a no-JS or reduced-motion render is already
  // correct; the effect below arms it back to 0 only when it will animate.
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

  return (
    <div className="text-center">
      <p className="display-1">
        {formatNumber(n, locale)}
        {stat.suffix}
      </p>
      <p className="display-intro mx-auto mt-4 max-w-xs">{stat.label}</p>
    </div>
  )
}

export function Stats() {
  const { dictionary } = useDictionary()
  const { locale } = useLocale()
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

  const t = dictionary?.marketing?.site?.stats
  if (!t) return null

  const items = (t.items as Stat[]) ?? []
  if (items.length === 0) return null

  return (
    <section className="section-y">
      <SectionHeading title={t.title} description={t.description} />

      <div
        ref={wrapRef}
        className="grid grid-cols-1 gap-12 pt-10 md:grid-cols-3"
      >
        {items.map((stat, i) => (
          <StatItem
            key={stat.label}
            stat={stat}
            index={i}
            play={play}
            locale={locale}
          />
        ))}
      </div>
    </section>
  )
}
