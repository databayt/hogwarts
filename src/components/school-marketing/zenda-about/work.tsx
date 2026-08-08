// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/work) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css).

import { Fragment } from "react"

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AboutWorkScroll } from "./work-scroll"

/**
 * About "What we do" — a "What we do" eyebrow over a large statement heading
 * whose characters fade from grey to black as you scroll (see <AboutWorkScroll/>).
 * Ported from zenda.com/about-us; the two paragraphs are separated by a double
 * line break, exactly like the reference's `<br><br>`.
 */

// English fallback values — see marketing.site.about.work in en.json/ar.json
// for the live copy this renders when a dictionary is supplied.
const PARAGRAPHS_FALLBACK = [
  "Our school is built with purpose, for students and parents alike - grounded in a deep understanding of how children learn and grow.",
  "In a world of one-size-fits-all education, we offer a close-knit learning community - small classes, attentive teachers and an open door for every family, from the first bell of kindergarten to graduation day.",
]

// Split into word/char spans the way SplitType does, so the scroll timeline can
// tween each `.char`'s colour. Words are inline-block so they never break
// mid-word; the space rendered between them keeps the natural wrap points.
//
// ARABIC IS SPLIT PER WORD, NOT PER CHARACTER, and this is a correctness fix
// rather than a refinement. Arabic is cursive: a letter takes a different glyph
// depending on whether it starts, sits inside, or ends a word, and the shaper
// can only choose once the letters are in one text run. Wrapping each character
// in its own span breaks every run, so every letter falls back to its isolated
// form and the word stops joining up. Measured in the browser on this page's
// own font: the same Arabic line renders 13.3% wider split per character than
// as plain text, and 0% wider split per word. The width is just the tell — the
// real damage is that the text reads as disconnected letters.
//
// The `.char` class stays on whatever the unit is, so work-scroll.tsx needs no
// change: the sweep simply advances a word at a time in Arabic instead of a
// letter at a time. Same effect, one notch coarser, and legible.
function splitChars(text: string, p: number, perWord: boolean) {
  return text.split(" ").map((word, wi) => (
    <Fragment key={`${p}-${wi}`}>
      {wi > 0 ? " " : null}
      <span className="word">
        {perWord ? (
          <span className="char">{word}</span>
        ) : (
          Array.from(word).map((ch, ci) => (
            <span key={ci} className="char">
              {ch}
            </span>
          ))
        )}
      </span>
    </Fragment>
  ))
}

// Arabic is the only RTL locale here, but test the SCRIPT rather than the
// locale: the tenant's own name or a quoted phrase can put Arabic into an
// English page, and the shaping problem follows the letters, not the route.
const HAS_ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/

export function Work({ dictionary }: { dictionary?: Dictionary }) {
  const t = dictionary?.marketing?.site?.about?.work
  const paragraphs = [
    t?.paragraph1 ?? PARAGRAPHS_FALLBACK[0],
    t?.paragraph2 ?? PARAGRAPHS_FALLBACK[1],
  ]
  // Decided per paragraph, from its own text, so a mixed page gets each right.
  const perWord = paragraphs.map((p) => HAS_ARABIC.test(p))
  return (
    <section className="section_about-work">
      <div className="padding-global-v2 padding-section-large">
        <div className="about-work_container container-small">
          <div about-work-wrap="" className="about-work_wrap">
            <div className="tag is-text">{t?.eyebrow ?? "What we do"}</div>
            <div className="padding-bottom padding-large" />
            <h2
              id="about-work-heading"
              about-work-heading=""
              className="about-work_heading heading-style-h2"
            >
              {splitChars(paragraphs[0], 0, perWord[0])}
              <br />
              <br />
              {splitChars(paragraphs[1], 1, perWord[1])}
            </h2>
          </div>
        </div>
      </div>
      <AboutWorkScroll />
    </section>
  )
}
