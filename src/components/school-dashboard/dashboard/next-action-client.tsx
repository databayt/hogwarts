"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import type { NextAction } from "./next-action-rank"

/**
 * The phone dashboard's next-action banner, and the third copy of the green
 * hero object — the same ground, geometry, type and pills as
 * `school-dashboard/live/landing/status-hero.tsx` and
 * `components/library/hero.tsx`. When one changes, change all three: the hex,
 * the radius, the headline face, the two-pill row.
 *
 * Its arrangement is the /live banner's, down to the pair of buttons: one white
 * pill for the way in, one ghost beside it, both a single word.
 *
 * Two things here are deliberately NOT shared with those siblings, because
 * only this copy cycles:
 *
 *  1. A FIXED height. The siblings state one sentence and can be as tall as it
 *     needs; this one swaps its sentence every few seconds, and a card that
 *     grew and shrank under the reader would shove the rest of the dashboard
 *     up and down on a timer. The headline is pinned to a two-line box, which
 *     is what makes the card's own height constant — by construction rather
 *     than by a magic pixel number, so it survives a change of type size. The
 *     padding is a step deeper than /live's for the same reason a phone card
 *     wants more air than a page banner.
 *  2. The MOTION between sentences (below).
 *
 * Literal hexes on purpose, inherited from those siblings. This is a brand
 * ground, not a themed surface: it does NOT invert, and every piece of ink on
 * it is pinned DARK rather than tokenised — white on `#00bc6d` measures about
 * 2.5:1 and is unreadable, which is why the marketing hero pairs this green
 * with black. Nothing here may use `primary-foreground`: on this ground that
 * token is white in light mode and black in dark, which is exactly backwards.
 *
 * What is NOT carried over is the marginalia art. Both siblings hide it below
 * `md`, where the card stacks and it would sit under the headline instead of
 * beside it — and this card only ever renders below `md`, so the art would be
 * hidden at every width it can be seen at.
 *
 * The card states ONE action, the most important the role has, and flips to the
 * next on a timer. Ranking is the server's (`rankNextActions`); this component
 * only rotates.
 */

/** How long a fully-revealed sentence holds before it leaves. */
const HOLD_MS = 10_000

/**
 * The leave — the sentence evaporates.
 *
 * Two motions at once, reversed from `components/ui/blur-in-text.tsx`, which
 * is where this vocabulary (blur + opacity, nothing else) comes from: the
 * whole line lifts and goes out of focus, while the letters themselves fade
 * one after another rather than together. The stagger is what makes it read as
 * smoke instead of as a dissolve — ink leaving the line in sequence, not all
 * at once.
 *
 * The spread is a TOTAL, divided across however many letters the sentence has,
 * so a long line and a short one take the same time to go.
 *
 * Opacity is deliberately faster than the blur and lands first: the headline
 * sits in a clipped two-line box, so a blur still carrying ink when it reaches
 * the box edge would be cut off in a straight line. By the time the blur is
 * wide enough to reach an edge there is nothing left to see.
 */
const SMOKE_SPREAD_MS = 300
const SMOKE_FADE_MS = 340
/**
 * The last letter starts its fade a full spread late, so the sentence is only
 * actually gone at spread + fade. The cushion is what keeps the swap from
 * landing on that exact frame and cutting the tail off mid-fade.
 */
const SMOKE_MS = SMOKE_SPREAD_MS + SMOKE_FADE_MS + 60

/**
 * The entrance — the sentence sorts itself out of noise.
 *
 * This is the scramble-reveal from `components/atom/encrypted-text.tsx`, the
 * atom written for the old site's "Take Sorting Quiz" link: every letter
 * starts as a random one and flips until its turn comes, left to right. Ported
 * rather than imported because the same letters also have to carry the leave
 * above, and one owner of the spans is simpler than two.
 */
const REVEAL_MS_PER_CHAR = 26
const FLIP_MS = 55

/**
 * What the noise is made of, per locale.
 *
 * Latin gibberish inside an Arabic line is not just wrong-looking: it opens a
 * left-to-right run inside a right-to-left one, and the bidi algorithm then
 * moves it around the line as it flips. Arabic letters keep the run whole, and
 * they join to each other the way the real sentence does, so the noise reads as
 * text being sorted rather than as a redaction.
 */
const ARABIC_CHARSET = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي"
const LATIN_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

/**
 * One rendered unit: a base letter with any combining marks that belong to it.
 *
 * Splitting on code points would tear a shadda or a damma off the letter it
 * sits on ("لم يُسلَّم") and give it a span of its own, which renders as a
 * floating accent. Matching a non-mark followed by its marks keeps them
 * together.
 */
const CLUSTERS = /\P{M}\p{M}*|\p{M}+/gu

interface Piece {
  ch: string
  bold: boolean
}

/**
 * The sentence as a flat list of letters, each knowing whether it carries the
 * weight.
 *
 * Every template OPENS with an emphasised phrase, delimited `**like this**`,
 * with the data's `{mark}` inside it — so the weight always lands on the first
 * words, the shape the /live banner's headline has. The delimiters, rather than
 * emphasising the bare `{mark}`, are what let the phrase be a phrase: a count
 * alone sets one bold digit adrift in a light line, where "**2 active issues**
 * need attention" reads as a subject and a predicate. Where the phrase ends
 * differs per language, which is exactly why it is the translator's call and
 * not this file's.
 *
 * Markup, not tags, and asterisks specifically: an Arabic translator moving a
 * `<strong>` through a right-to-left string would have to carry the angle
 * brackets with it, and a stray one renders as text. `{mark}` is substituted
 * INSIDE each segment, after the split, so a record title containing asterisks
 * cannot reopen the emphasis.
 *
 * A template with no delimiters still emphasises — everything up to and
 * including the data — so a kind added later without them is plain, never
 * unemphasised.
 *
 * Flat, not nested, because both motions run across the whole line: the reveal
 * order and the fade order have to continue through the boundary between the
 * emphasised phrase and the rest, not restart at it.
 */
function toPieces(template: string | undefined, mark: string): Piece[] {
  const clusters = (s: string, bold: boolean): Piece[] =>
    (s.match(CLUSTERS) ?? []).map((ch) => ({ ch, bold }))

  if (!template) return clusters(mark, true)

  if (template.includes("**")) {
    return template
      .split("**")
      .flatMap((seg, i) => clusters(seg.replace("{mark}", mark), i % 2 === 1))
  }

  const [before, after] = template.split("{mark}")
  if (after === undefined) return clusters(template, false)

  return [...clusters(before + mark, true), ...clusters(after, false)]
}

interface NextActionCardProps {
  actions: NextAction[]
  locale: string
  className?: string
}

export function NextActionCard({
  actions,
  locale,
  className,
}: NextActionCardProps) {
  const { dictionary } = useDictionary()
  const dict = dictionary?.school?.dashboard?.nextAction as
    | { cta?: string; acknowledge?: string; kinds?: Record<string, string> }
    | undefined

  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)
  /**
   * Actions the reader has acknowledged, by rank position.
   *
   * A LOCAL dismissal and nothing more — it takes the entry off this card for
   * this visit; it does not hand the assignment in, mark the register, or
   * approve anything, because no such write exists behind these ranked rows.
   * "Acknowledge" is the honest word for what it does: the reader has seen
   * this and does not want it again on this screen. The next reload asks the
   * data again.
   */
  const [dismissed, setDismissed] = useState<number[]>([])

  const live = useMemo(
    () => actions.filter((_, i) => !dismissed.includes(i)),
    [actions, dismissed]
  )
  const action = live[index % Math.max(1, live.length)]
  // Keyed on the two STRINGS, not on the objects they came out of: `pieces`
  // feeds an effect that sets state, so an identity that changed every render
  // would restart the scramble on its own output and never settle.
  const template = (action && dict?.kinds?.[action.kind]) ?? ""
  const mark = action?.mark ?? ""
  const pieces = useMemo(
    () => toPieces(template || undefined, mark),
    [template, mark]
  )

  const revealMs = pieces.length * REVEAL_MS_PER_CHAR

  /**
   * The cycle.
   *
   * Index advances only inside an effect, so the server and the first client
   * render agree on index 0 and there is no hydration mismatch. The clock
   * starts where the sentence finishes arriving, not where the last one left:
   * the reader gets the full hold on a line they can actually read.
   *
   * Reduced motion removes the ANIMATION, not the rotation. Freezing the card
   * on entry one would hide every action behind it from exactly the readers
   * who cannot swipe a carousel to find them, so the copy still changes on the
   * same clock — it simply cuts instead of evaporating.
   */
  useEffect(() => {
    if (live.length < 2) return
    if (typeof window === "undefined") return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const enter = reduce ? 0 : revealMs
    const leave = reduce ? 0 : SMOKE_MS

    let holdTimer: ReturnType<typeof setTimeout> | undefined
    let advanceTimer: ReturnType<typeof setTimeout> | undefined
    let onVisible: (() => void) | undefined

    /**
     * A hidden tab still runs timers, and cycling the whole list into a page
     * nobody is looking at just lands the reader on an arbitrary entry. So a
     * hidden tab does not flip — it waits for the reader and then starts the
     * hold OVER, rather than flipping the instant they look back.
     */
    const arm = () => {
      holdTimer = setTimeout(() => {
        if (document.hidden) {
          onVisible = arm
          document.addEventListener("visibilitychange", arm, { once: true })
          return
        }

        if (!reduce) setLeaving(true)
        advanceTimer = setTimeout(() => {
          setIndex((i) => (i + 1) % live.length)
          setLeaving(false)
        }, leave)
      }, enter + HOLD_MS)
    }

    arm()

    return () => {
      if (holdTimer) clearTimeout(holdTimer)
      if (advanceTimer) clearTimeout(advanceTimer)
      if (onVisible) document.removeEventListener("visibilitychange", onVisible)
    }
  }, [live.length, index, revealMs])

  if (!action) return null

  return (
    <section className={cn("md:hidden", className)}>
      <div className="relative isolate overflow-hidden rounded-[36px] bg-[#00bc6d] px-8 py-12 text-[#050505]">
        {/* The siblings' headline, at their mobile size: ~7 words over two
            lines in a ~16ch measure, the emphasis carried by WEIGHT inside an
            otherwise light line rather than by a highlight.

            The face is thmanyah sans, vendored in `public/fonts/` and
            declared by `src/styles/thmanyah-clone.css`, which the ROOT layout
            imports — so it is available here without this page loading
            anything of its own. It ships five weights and this line uses two:
            300 for the sentence, 700 for the phrase that carries it. A weight
            the family does not have would be synthesised by the browser and
            lose the face's own drawing, which is the whole reason to use it.

            `h-[2.7em]` is exactly two lines of `leading-[1.35]`, and it is the
            only thing standing between the copy and a card that changes height
            on a timer. `text-balance` is what splits those two lines to near
            equal width instead of leaving a long line over a short one. */}
        <SortingHeadline
          key={index}
          pieces={pieces}
          leaving={leaving}
          locale={locale}
        />

        {/* The siblings' pair, in their arrangement: one white pill for the way
            in, one ghost beside it, both a single word. `mt-7` and `h-10` are
            theirs too, so the row under the headline reads at the same rhythm.

            "Acknowledge" is a LOCAL dismissal — see `dismissed` above. It is
            a button, not a link, because it goes nowhere. */}
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <Link className={pill("default")} href={`/${locale}${action.href}`}>
            {dict?.cta || "Open"}
          </Link>
          <button
            type="button"
            className={pill("ghost")}
            onClick={() => {
              const at = actions.indexOf(action)
              if (at >= 0) setDismissed((d) => [...d, at])
              setIndex(0)
              setLeaving(false)
            }}
          >
            {dict?.acknowledge || "Acknowledge"}
          </button>
        </div>
      </div>
    </section>
  )
}

/**
 * The siblings' pill: white with dark ink on the green ground, pinned like
 * everything else on this banner so it reads the same in both themes. A token
 * pair would invert in dark mode and lose the contrast the ground was chosen
 * for. Copied from `live/landing/status-hero.tsx`; when one changes, change
 * both.
 */
function pill(variant: "default" | "ghost") {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-full px-5",
    "text-sm font-medium whitespace-nowrap transition-colors",
    "outline-none focus-visible:ring-2 focus-visible:ring-[#050505]/40",
    variant === "default"
      ? "bg-white text-[#050505] hover:bg-white/90"
      : "text-[#050505]/75 hover:bg-[#050505]/10 hover:text-[#050505]"
  )
}

/**
 * The headline, and both of its motions.
 *
 * Remounted per action (the caller keys it on the index), so the scramble
 * restarts by construction rather than by resetting five refs.
 *
 * Every letter is its own span. Arabic still joins across them — shaping runs
 * over the inline run, not per element — and the two properties animated here,
 * `opacity` and `filter`, do not affect it. `display: inline-block` DOES break
 * the joining, which is why the lift is one `translate` on the block and never
 * a per-letter one.
 */
function SortingHeadline({
  pieces,
  leaving,
  locale,
}: {
  pieces: Piece[]
  leaving: boolean
  locale: string
}) {
  const charset = locale === "en" ? LATIN_CHARSET : ARABIC_CHARSET
  const plain = pieces.map((p) => p.ch).join("")

  // Server render and first client render are the real sentence — the noise is
  // seeded in an effect, after hydration, so `Math.random` never reaches the
  // markup the two have to agree on.
  const [revealed, setRevealed] = useState(pieces.length)
  const noise = useRef<string[]>([])
  const [, repaint] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const pick = () =>
      charset.charAt(Math.floor(Math.random() * charset.length))
    const scramble = () => {
      noise.current = pieces.map((p) => (p.ch === " " ? " " : pick()))
    }

    scramble()
    setRevealed(0)

    const start = performance.now()
    let lastFlip = start
    let frame = 0

    const step = (now: number) => {
      const done = Math.min(
        pieces.length,
        Math.floor((now - start) / REVEAL_MS_PER_CHAR)
      )
      setRevealed(done)
      if (done >= pieces.length) return

      if (now - lastFlip >= FLIP_MS) {
        for (let i = done; i < pieces.length; i += 1) {
          noise.current[i] = pieces[i].ch === " " ? " " : pick()
        }
        lastFlip = now
        // `revealed` only changes every REVEAL_MS_PER_CHAR, so on its own it
        // would hold the paint still between steps and the noise would sit
        // frozen. This is what makes the unrevealed letters actually flip.
        repaint((n) => n + 1)
      }

      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [pieces, charset])

  // Divided across the sentence rather than fixed per letter, so the leave
  // takes the same time whatever the copy is.
  const stagger = SMOKE_SPREAD_MS / Math.max(1, pieces.length)

  return (
    <h2
      aria-label={plain}
      className={cn(
        "h-[2.7em] max-w-[16ch] overflow-hidden text-3xl leading-[1.35] font-light text-balance",
        // `translate`, not `transform` — Tailwind v4 sets the standalone CSS
        // property, so a transition list naming `transform` animates the blur
        // and snaps the lift.
        "transition-[filter,translate] duration-500 ease-out motion-reduce:transition-none",
        leaving ? "-translate-y-1.5 blur-[6px]" : "translate-y-0 blur-none"
      )}
      style={{ fontFamily: '"thmanyah sans", sans-serif' }}
    >
      <span aria-hidden="true">
        {pieces.map((piece, i) => (
          <span
            key={i}
            className={cn(
              "transition-opacity ease-in motion-reduce:transition-none",
              piece.bold && "font-bold",
              leaving ? "opacity-0" : "opacity-100"
            )}
            style={{
              transitionDuration: `${SMOKE_FADE_MS}ms`,
              transitionDelay: leaving ? `${Math.round(i * stagger)}ms` : "0ms",
            }}
          >
            {i < revealed ? piece.ch : (noise.current[i] ?? piece.ch)}
          </span>
        ))}
      </span>
    </h2>
  )
}
