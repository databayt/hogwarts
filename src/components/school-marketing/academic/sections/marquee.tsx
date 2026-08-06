"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

/*
 * zenda's three-row word marquee, the section that sits directly under the
 * /for-schools hero and that the building crosses on its way down the page.
 *
 * Two motions, and only one of them is the marquee:
 *
 *   1. Each row runs a continuous CSS translate loop -- rows 1 and 3 leftward,
 *      row 2 rightward. Pure CSS, so it costs nothing on the main thread and
 *      keeps running while the merge controller is doing rAF work next door.
 *   2. The whole block converges IN PLACE as the section rises into view:
 *      scale 1.6 -> 1, opacity 0 -> 0.4. There is no translateY, deliberately --
 *      the reference has none either, and adding one makes the bottom row
 *      arrive visibly late. The low opacity ceiling is the point: these words
 *      are a backdrop for the building, not a thing to read.
 *
 * Structure: each row holds one track with TWO identical copies of the word
 * list. The keyframes slide the track by exactly -50%, which is one copy's
 * width, so the second copy lands precisely where the first began and the seam
 * never shows. Anything other than two equal copies and the loop tears.
 */

/** Dot colours cycle so no two adjacent separators match, as zenda's do. */
const DOTS = ["", "is-blue", "is-pink", "is-orange", "is-purple"] as const

const FALLBACK_WORDS = [
  "Science",
  "Mathematics",
  "Literature",
  "Robotics",
  "Music",
  "Athletics",
  "Languages",
  "Debate",
  "Visual Arts",
  "Coding",
  "Library",
  "Field Trips",
]

function Copy({ words, offset }: { words: string[]; offset: number }) {
  return (
    <div className="mq-copy">
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="contents">
          <div className="mq-word">{word}</div>
          <div
            className={`mq-dot ${DOTS[(i + offset) % DOTS.length]}`.trim()}
          />
        </span>
      ))}
    </div>
  )
}

function Row({
  words,
  offset,
  reverse,
}: {
  words: string[]
  offset: number
  reverse?: boolean
}) {
  return (
    <div className={`mq-row ${reverse ? "is-reverse" : ""}`.trim()}>
      <div className="mq-track">
        <Copy words={words} offset={offset} />
        <Copy words={words} offset={offset} />
      </div>
      <div className="mq-fade" />
      <div className="mq-fade is-end" />
    </div>
  )
}

export function AcademicMarquee({ words }: { words?: string[] }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start start"],
  })
  const scale = useTransform(scrollYProgress, [0.2, 0.82], [1.6, 1])
  const opacity = useTransform(scrollYProgress, [0.2, 0.82], [0, 0.4])

  const list = words?.length ? words : FALLBACK_WORDS

  // Each row starts at a different point in the same list, so the three read as
  // one vocabulary shuffled rather than three copies of one line.
  const rotate = (n: number) => [...list.slice(n), ...list.slice(0, n)]
  const third = Math.floor(list.length / 3)

  return (
    <section ref={ref} className="mq-section" aria-hidden="true">
      <div className="mq-container">
        <motion.div className="mq-component" style={{ scale, opacity }}>
          <Row words={rotate(0)} offset={0} />
          <Row words={rotate(third)} offset={2} reverse />
          <Row words={rotate(third * 2)} offset={4} />
        </motion.div>
      </div>
    </section>
  )
}
