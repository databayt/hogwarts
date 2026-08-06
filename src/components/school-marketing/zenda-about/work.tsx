// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/work) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css).

import { Fragment } from "react"

import { AboutWorkScroll } from "./work-scroll"

/**
 * About "What we do" — a "What we do" eyebrow over a large statement heading
 * whose characters fade from grey to black as you scroll (see <AboutWorkScroll/>).
 * Ported from zenda.com/about-us; the two paragraphs are separated by a double
 * line break, exactly like the reference's `<br><br>`.
 */
const PARAGRAPHS = [
  "Our school is built with purpose, for students and parents alike - grounded in a deep understanding of how children learn and grow.",
  "In a world of one-size-fits-all education, we offer a close-knit learning community - small classes, attentive teachers and an open door for every family, from the first bell of kindergarten to graduation day.",
]

// Split into word/char spans the way SplitType does, so the scroll timeline can
// tween each `.char`'s colour. Words are inline-block so they never break
// mid-word; the space rendered between them keeps the natural wrap points.
function splitChars(text: string, p: number) {
  return text.split(" ").map((word, wi) => (
    <Fragment key={`${p}-${wi}`}>
      {wi > 0 ? " " : null}
      <span className="word">
        {Array.from(word).map((ch, ci) => (
          <span key={ci} className="char">
            {ch}
          </span>
        ))}
      </span>
    </Fragment>
  ))
}

export function Work() {
  return (
    <section className="section_about-work">
      <div className="padding-global-v2 padding-section-large">
        <div className="about-work_container container-small">
          <div about-work-wrap="" className="about-work_wrap">
            <div className="tag is-text">What we do</div>
            <div className="padding-bottom padding-large" />
            <h2
              id="about-work-heading"
              about-work-heading=""
              className="about-work_heading heading-style-h2"
            >
              {splitChars(PARAGRAPHS[0], 0)}
              <br />
              <br />
              {splitChars(PARAGRAPHS[1], 1)}
            </h2>
          </div>
        </div>
      </div>
      <AboutWorkScroll />
    </section>
  )
}
