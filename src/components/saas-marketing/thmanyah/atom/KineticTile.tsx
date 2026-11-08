"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion"

/**
 * The wireframe strip's tiles, as kinetic type. The reference filled these
 * slots with Lotties demonstrating its typeface (a greeting in three
 * languages, a glyph grid, ج ر ن in three families, a word, letter-anatomy
 * circles). Each tile keeps its slot, its colour and its kind of motion, and
 * says something about the school instead — set live in our three faces.
 *
 * Every tile fills its `.wire-tile--N` box (aspect ratios untouched in
 * thmanyah-clone.css) and sizes its type in container units, so one tile
 * reads the same at 393px and at 1512px. Motion runs only while the tile is
 * on screen and stops for `prefers-reduced-motion`.
 */

const DISPLAY = '"thmanyah serif display", serif'
const TEXT = '"thmanyah serif text", serif'
const SANS = '"thmanyah sans", sans-serif'
const FACES = [DISPLAY, TEXT, SANS]

const ARABIC = /[؀-ۿ]/
const dirOf = (s: string) => (ARABIC.test(s) ? "rtl" : "ltr")

const SWAP = {
  initial: { opacity: 0, y: "18%" },
  animate: { opacity: 1, y: "0%" },
  exit: { opacity: 0, y: "-18%" },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
}

/** A step counter that ticks only while `ref` is on screen. */
function useTicker(ms: number) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const reduced = useReducedMotion()
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!inView || reduced) return
    const id = window.setInterval(() => setTick((t) => t + 1), ms)
    return () => window.clearInterval(id)
  }, [inView, reduced, ms])
  return { ref, tick }
}

function Tile({
  bg,
  ink,
  tileRef,
  children,
}: {
  bg: string
  ink: string
  tileRef: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}) {
  return (
    <div
      ref={tileRef}
      className="kt-tile"
      style={{ backgroundColor: bg, color: ink }}
    >
      {children}
    </div>
  )
}

/** Tile 1 · green — the same word in both scripts, one beat each. */
export function WordsTile({ words }: { words: string[] }) {
  const { ref, tick } = useTicker(1600)
  const word = words[tick % words.length]
  return (
    <Tile bg="#00bc6d" ink="#000" tileRef={ref}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={word}
          {...SWAP}
          dir={dirOf(word)}
          className="kt-word"
          style={{ fontFamily: DISPLAY, fontSize: "34cqh" }}
        >
          {word}
        </motion.p>
      </AnimatePresence>
    </Tile>
  )
}

/** Tile 2 · black — a 4x3 grid of the school's numbers and marks; one cell
 *  at a time swaps in the next glyph from the pool. */
export function GlyphGridTile({ glyphs }: { glyphs: string[] }) {
  const { ref, tick } = useTicker(650)
  const cells = Array.from({ length: 12 }, (_, i) => {
    // Cell (tick % 12) has been swapped floor(tick / 12) + 1 times; the rest
    // floor(tick / 12) (or one more if they come before it this round).
    const round = Math.floor(tick / 12) + (i < tick % 12 ? 1 : 0)
    return glyphs[(i + round * 12) % glyphs.length]
  })
  return (
    <Tile bg="#000" ink="#fff" tileRef={ref}>
      <div className="kt-grid" dir="ltr">
        {cells.map((g, i) => (
          <div key={i} className="kt-cell">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={g}
                {...SWAP}
                dir={dirOf(g)}
                style={{ fontFamily: SANS, fontWeight: 700, fontSize: "15cqh" }}
              >
                {g}
              </motion.span>
            </AnimatePresence>
          </div>
        ))}
      </div>
    </Tile>
  )
}

/** Tile 3 · cream — one grade, three readers, three faces: the way the
 *  reference set ج ر ن in its three families. */
export function FacesTile({
  word,
  roles,
}: {
  word: string
  roles: [string, string, string]
}) {
  const { ref, tick } = useTicker(1800)
  const i = tick % 3
  return (
    <Tile bg="#f4eeeb" ink="#000" tileRef={ref}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={i} {...SWAP} className="kt-stack">
          <p
            dir={dirOf(word)}
            className="kt-word"
            style={{
              fontFamily: FACES[i],
              fontWeight: i === 0 ? 900 : 700,
              fontSize: "32cqh",
            }}
          >
            {word}
          </p>
          <p
            dir={dirOf(roles[i])}
            className="kt-caption"
            style={{ fontFamily: SANS, fontSize: "9cqh" }}
          >
            {roles[i]}
          </p>
        </motion.div>
      </AnimatePresence>
    </Tile>
  )
}

/** Tile 4 · mint — the school's own rules (calendar, scale, term), flipping. */
export function RulesTile({ rules }: { rules: string[] }) {
  const { ref, tick } = useTicker(1400)
  const rule = rules[tick % rules.length]
  return (
    <Tile bg="#afe4b6" ink="#000" tileRef={ref}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={rule}
          {...SWAP}
          dir={dirOf(rule)}
          className="kt-word"
          style={{ fontFamily: DISPLAY, fontSize: "30cqh" }}
        >
          {rule}
        </motion.p>
      </AnimatePresence>
    </Tile>
  )
}

/** Tile 5 · green + mint circle — the offline outbox: the circle is empty
 *  while offline, fills while syncing, and is whole once synced. */
export function SyncTile({ states }: { states: [string, string, string] }) {
  const { ref, tick } = useTicker(1500)
  const s = tick % 3
  return (
    <Tile bg="#00bc6d" ink="#000" tileRef={ref}>
      <div className="kt-circle">
        <motion.div
          className="kt-circle-fill"
          initial={false}
          animate={{ scale: [0.001, 0.55, 1][s] }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={s}
            {...SWAP}
            dir={dirOf(states[s])}
            className="kt-word kt-circle-word"
            style={{ fontFamily: DISPLAY, fontSize: "13cqh" }}
          >
            {s === 2 ? `✓ ${states[s]}` : states[s]}
          </motion.p>
        </AnimatePresence>
      </div>
    </Tile>
  )
}
