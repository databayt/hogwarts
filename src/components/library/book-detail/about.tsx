"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"

interface Props {
  heading: string
  /** Paragraphs, in order. Empty ones are dropped by the caller. */
  paragraphs: string[]
  moreLabel: string
  lessLabel: string
}

/**
 * The reference's "From the Publisher" block: a heading, the publisher's own
 * words, and a `More` that opens the rest inline rather than pushing the
 * reader into a dialog.
 *
 * ONE paragraph element holding every paragraph, blank-line separated, rather
 * than a `<p>` each inside a clamped wrapper. `line-clamp` works by switching
 * the element to `-webkit-box`, which only counts line boxes it owns directly
 * — wrapped in block children it measured nothing and clamped nothing, which
 * is what this did first. `whitespace-pre-line` keeps the blank lines.
 *
 * Whether there IS a fourth line is measured, not guessed from a character
 * count: the same blurb clamps at three lines in Arabic and runs to two in
 * English, and a `More` that opens nothing is worse than no button. The
 * measurement re-runs on resize, because the clamp is a function of the
 * column's width.
 */
export function BookAbout({
  heading,
  paragraphs,
  moreLabel,
  lessLabel,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const bodyRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const body = bodyRef.current
    if (!body) return

    // Only meaningful while collapsed — expanded, scrollHeight IS clientHeight
    // and the button would delete itself the moment it was used.
    const measure = () => {
      if (expanded) return
      setClamped(body.scrollHeight > body.clientHeight + 1)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(body)
    return () => observer.disconnect()
  }, [expanded])

  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold">{heading}</h2>
      <p
        ref={bodyRef}
        className={`text-muted-foreground leading-relaxed whitespace-pre-line ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {paragraphs.join("\n\n")}
      </p>
      {clamped && (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="text-foreground text-sm font-semibold"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </section>
  )
}
