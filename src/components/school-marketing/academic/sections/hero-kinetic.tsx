"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"

/*
 * The zenda.com/for-schools hero entrance, retargeted at this page.
 *
 * What it does, in the reference's own numbers (components/for-schools/hero.tsx
 * in ~/zenda):
 *   - a fixed splash of three circles expands on a `difference` blend, holds
 *     ~1.5s, then fades over 0.4s;
 *   - underneath, every WORD of the headline flies in from a scattered start
 *     (x +/-400..880%, y +/-300..680%, scale 2.2..3.8) and settles over ~2s on
 *     ease [0.33, 1, 0.68, 1] -- so the page is already assembling itself while
 *     the splash is still up;
 *   - a colored panel sits behind the last word at 108% width and retracts to
 *     0 over 1.4s, reading as a highlight sweeping off;
 *   - the building illustration lands last, at 1.85s (see ./hero-art).
 *
 * Two deliberate departures from the reference:
 *
 * 1. No 16vh hero lift. In the reference the whole block is held low and lifts
 *    at 1.9s. It exists to make room for the building, which arrives at the
 *    same moment -- but the reference's building is a fixed overlay that
 *    ignores the lift, so all the lift actually does is jolt the settled words.
 *    Ours reserves the building's box from the first frame instead.
 * 2. Reduced motion is honored. zenda forces `reducedMotion="never"` on this
 *    entrance; a school's public site should not. Under `reduce` the words are
 *    simply there, the splash never mounts, and the highlight does not sweep.
 *
 * The scatter is derived from the word index, not authored per word, so the
 * effect survives a headline of any length in any language -- the reference
 * hard-codes an offset per word and would break the moment the copy changed.
 * Line breaks, though, ARE authored: a `\n` in the dictionary becomes a real
 * break, so a translation picks where it wants to turn rather than inheriting
 * wherever English happened to run out of measure.
 */

const EASE = [0.33, 1, 0.68, 1] as const

/** Scatter start for word `i`, mirrored under RTL so words fly in with the
 *  reading direction rather than against it. */
function scatter(i: number, rtl: boolean) {
  const sign = i % 2 === 0 ? -1 : 1
  const x = sign * (400 + (i % 3) * 160) * (rtl ? -1 : 1)
  const y = (i % 2 === 0 ? -1 : 1) * (380 + (i % 2) * 300)
  return {
    x: `${x}%`,
    y: `${y}%`,
    scale: 2.4 + (i % 3) * 0.45,
    duration: 2 + (i % 2) * 0.4,
  }
}

const wordVariants = {
  hidden: (c: { x: string; y: string; scale: number }) => ({
    opacity: 0,
    x: c.x,
    y: c.y,
    scale: c.scale,
  }),
  visible: (c: { duration: number }) => ({
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: { duration: c.duration, ease: EASE },
  }),
}

function Splash() {
  const [visible, setVisible] = useState(true)
  const [mounted, setMounted] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 1500)
    return () => clearTimeout(t)
  }, [])

  if (!mounted) return null

  // `difference` + `exclusion` on a near-white plate is what gives the circles
  // their inverted look over whatever is behind them. pointer-events:none
  // throughout -- the hero underneath stays clickable the whole time.
  const circle = {
    position: "absolute" as const,
    aspectRatio: "1 / 1",
    borderRadius: "100vw",
    mixBlendMode: "exclusion" as const,
  }

  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      onAnimationComplete={() => {
        if (!visible) setMounted(false)
      }}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#eee",
        mixBlendMode: "difference",
        pointerEvents: "none",
      }}
    >
      {[
        { w: "26%", d: 0, dur: 1, fill: true },
        { w: "42%", d: 0.05, dur: 1.1, fill: false },
        { w: "72%", d: 0.18, dur: 1.25, fill: false },
      ].map((c) => (
        <motion.div
          key={c.w}
          initial={{ scale: 0 }}
          animate={{ scale: 1.4 }}
          transition={{
            delay: c.d,
            duration: c.dur,
            ease: [0.34, 1.56, 0.64, 1],
          }}
          style={{
            ...circle,
            width: c.w,
            ...(c.fill
              ? { backgroundColor: "#fff" }
              : { border: "0.25rem solid #edf0f9" }),
          }}
        />
      ))}
    </motion.div>
  )
}

export function AcademicHeroKinetic({
  titleLines,
  subtitle,
  rtl,
}: {
  /** The headline, already split on `\n` into lines and each line into words. */
  titleLines: string[][]
  subtitle: string
  rtl: boolean
}) {
  const reduced = useReducedMotion()

  /*
   * The tuck. zenda loads /for-schools already scrolled down by one nav height,
   * so the hero sits flush against the top edge and the nav waits just above
   * the fold until the first upward scroll. The nav owns the behaviour (it is
   * the thing that has to move); this only announces that the page wants it.
   * See the listener in template/zenda-nav/header.tsx.
   *
   * Fires under reduced motion too, deliberately: the tuck is an instantaneous
   * scroll POSITION, not a scroll animation, and without it this hero opens a
   * nav-height below the top edge in every mode. The nav's own mount-time check
   * for `[data-zenda-tuck]` is unconditional for the same reason -- gating one
   * and not the other would leave a fresh load and a client-side navigation
   * disagreeing about where the page starts.
   */
  useEffect(() => {
    window.dispatchEvent(new Event("zenda:hero-mounted"))
  }, [])

  const flat = titleLines.flat()
  const lastIndex = flat.length - 1
  const sentence = flat.join(" ")

  // aria-label carries the whole sentence: the words are separate elements and
  // a screen reader would otherwise announce them one at a time.
  const heading = (
    <h1
      aria-label={sentence}
      className="zenda-heading is-kinetic kinetic-heading"
    >
      {titleLines.map((line, li) => {
        const offset = titleLines.slice(0, li).reduce((n, l) => n + l.length, 0)
        return (
          <span key={`line-${li}`} className="contents">
            {li > 0 && <span className="kinetic-break" aria-hidden="true" />}
            {line.map((w, wi) => {
              const i = offset + wi
              const c = scatter(i, rtl)
              const word = reduced ? (
                <span className="kinetic-word">{w}</span>
              ) : (
                <motion.span
                  custom={c}
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className="kinetic-word"
                >
                  {w}
                </motion.span>
              )
              // The last word gets the retracting highlight, as "tomorrow" does
              // on the reference. It needs the relative wrapper to position
              // against.
              return (
                <span key={`${w}-${i}`} className="kinetic-word_wrap">
                  {i === lastIndex && !reduced ? (
                    <>
                      <span className="kinetic-word_lift">{word}</span>
                      <motion.span
                        initial={{ width: "108%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 1.4, ease: EASE }}
                        className="kinetic-word_sweep"
                        aria-hidden="true"
                      />
                    </>
                  ) : (
                    word
                  )}
                </span>
              )
            })}
          </span>
        )
      })}
    </h1>
  )

  if (reduced) {
    return (
      <div className="kinetic-header">
        {heading}
        <p className="kinetic-para">{subtitle}</p>
      </div>
    )
  }

  return (
    <>
      <Splash />
      <div className="kinetic-header">
        {heading}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.1, ease: EASE, delay: 1.5 }}
          className="kinetic-para"
        >
          {subtitle}
        </motion.p>
      </div>
    </>
  )
}
