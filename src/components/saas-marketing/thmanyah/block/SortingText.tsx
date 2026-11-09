"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"

/**
 * The dashboard's next-action headline motion, lifted for the hero ⇄ contact
 * swap (source: `school-dashboard/dashboard/next-action-client.tsx` —
 * SortingHeadline; read its notes for the why behind each number).
 *
 *   enter  the scramble-reveal: every letter starts as a random one from the
 *          locale's own alphabet and flips until its turn comes, in reading
 *          order.
 *   leave  the smoke: the line lifts and blurs while its letters fade one
 *          after another.
 *
 * Two differences from the dashboard copy, both because this runs on a
 * headline whose words are width-tuned flex items rather than inside a
 * clipped two-line box:
 *
 *  - Layout never moves. While animating, the real text stays in flow as an
 *    invisible ghost and the noise is drawn over it, so a random letter wider
 *    than the real one cannot re-wrap the hero mid-scramble.
 *  - At rest it is plain text — no spans, no ghost — so SSR markup and the
 *    accessible name are exactly the sentence.
 *
 * `order` / `total` place this run inside a longer line made of several
 * elements (the hero's words are separate h1 items): the reveal and the fade
 * both continue across the boundary instead of restarting per word.
 */

export const REVEAL_MS_PER_CHAR = 26
const FLIP_MS = 55
const SMOKE_SPREAD_MS = 300
const SMOKE_FADE_MS = 340
/** The whole leave, with the cushion that keeps the swap off its last frame. */
export const SMOKE_MS = SMOKE_SPREAD_MS + SMOKE_FADE_MS + 60

const ARABIC_CHARSET = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي"
const LATIN_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

/** A base letter with its combining marks — never a floating shadda. */
const CLUSTERS = /\P{M}\p{M}*|\p{M}+/gu
const isBlank = (ch: string) => /^\s+$/.test(ch)

export const clusterCount = (text: string) =>
  (text.match(CLUSTERS) ?? []).length

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

interface SortingTextProps {
  text: string
  rtl: boolean
  /** Scramble in on mount. False renders the sentence as-is (first paint). */
  scramble?: boolean
  /** Smoke out. */
  leaving?: boolean
  /** This run's first letter's position in the whole line. */
  order?: number
  /** Letters in the whole line; defaults to this run's own. */
  total?: number
  /** Keep the noise on one line (a single headline word): a wider random
   *  letter must not wrap inside the ghost's box. */
  nowrap?: boolean
  className?: string
}

export function SortingText({
  text,
  rtl,
  scramble = false,
  leaving = false,
  order = 0,
  total,
  nowrap = false,
  className,
}: SortingTextProps) {
  const pieces = useMemo(() => text.match(CLUSTERS) ?? [], [text])
  const charset = rtl ? ARABIC_CHARSET : LATIN_CHARSET
  const all = Math.max(1, total ?? pieces.length)

  const [revealed, setRevealed] = useState(() =>
    scramble && !prefersReducedMotion() ? 0 : pieces.length
  )
  const [noise, setNoise] = useState<string[]>(() =>
    revealed < pieces.length
      ? pieces.map((ch) =>
          isBlank(ch)
            ? ch
            : charset.charAt(Math.floor(Math.random() * charset.length))
        )
      : []
  )

  useEffect(() => {
    if (revealed >= pieces.length) return
    const pick = () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
    // Start where this run sits in the line, so words reveal in sequence.
    const start = performance.now() + order * REVEAL_MS_PER_CHAR
    let lastFlip = 0
    let frame = 0

    const step = (now: number) => {
      const done = Math.max(
        0,
        Math.min(pieces.length, Math.floor((now - start) / REVEAL_MS_PER_CHAR))
      )
      setRevealed(done)
      if (done >= pieces.length) return
      if (now - lastFlip >= FLIP_MS) {
        setNoise(pieces.map((ch, i) => (i < done || isBlank(ch) ? ch : pick())))
        lastFlip = now
      }
      frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
    // Runs once per mount: the caller remounts to replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const active = revealed < pieces.length || leaving
  if (!active) return <span className={className}>{text}</span>

  const stagger = SMOKE_SPREAD_MS / all

  return (
    <span
      className={cn(
        "relative block",
        "transition-[filter,translate] duration-500 ease-out motion-reduce:transition-none",
        leaving ? "-translate-y-1.5 blur-[6px]" : "translate-y-0 blur-none",
        className
      )}
    >
      {/* Ghost — holds the real sentence's box so nothing re-wraps. */}
      <span className="opacity-0">{text}</span>
      <span
        aria-hidden="true"
        className={cn("absolute inset-0", nowrap && "whitespace-nowrap")}
        /* Clip sideways only: noise wider than the word stays inside its
           box instead of running into the next one, while ascenders and
           descenders still clear the line. */
        style={nowrap ? { overflowX: "clip" } : undefined}
      >
        {pieces.map((ch, i) => (
          <span
            key={i}
            className="transition-opacity ease-in motion-reduce:transition-none"
            style={{
              opacity: leaving ? 0 : 1,
              transitionDuration: `${SMOKE_FADE_MS}ms`,
              transitionDelay: leaving
                ? `${Math.round((order + i) * stagger)}ms`
                : "0ms",
            }}
          >
            {i < revealed ? ch : (noise[i] ?? ch)}
          </span>
        ))}
      </span>
    </span>
  )
}
