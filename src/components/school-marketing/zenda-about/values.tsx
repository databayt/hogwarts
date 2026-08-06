// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/values) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css).

import { ValuesCards } from "./values-cards"

/**
 * About "Our Values" — a heading with a highlighted "values" pill over an
 * expanding accordion of four value cards. One card is open (light-blue, content
 * shown); the rest collapse to a numbered column with a vertical label. The
 * hover/tap interaction lives in <ValuesCards/> (GSAP). Ported from
 * zenda.com/about-us.
 */

type Value = { n: string; name: string; img: string; text: string }

const VALUES: Value[] = [
  {
    n: "01",
    name: "Rooted in Trust",
    img: "trust",
    text: "We see every family as a long-term partner. That’s why we listen closely, teach with care, and tell you the truth early—about a strong term and a hard one alike. Trust in a school isn’t won at open day; it’s earned every morning at the gate.",
  },
  {
    n: "02",
    name: "Stronger together",
    img: "together",
    text: "Real care means lifting each other up while still pushing for growth. Our students celebrate a classmate’s win, learn out loud from mistakes, and work in groups more often than alone. Because when children are in it together, hard things get easier and good things get bigger.",
  },
  {
    n: "03",
    name: "Teach for Mastery",
    img: "impact",
    text: "We don’t rush a class past a topic because the calendar says so. Lessons are built from where our students actually are, and we stay with a concept until it’s genuinely theirs. Excellence here means understanding that lasts long after the exam.",
  },
  {
    n: "04",
    name: "Own Your Learning",
    img: "charge",
    text: "We ask students to take responsibility—for their work, their word, and the room they share. Ownership means asking the question you’re afraid to ask, finishing what you started, and taking pride in it. It’s a high standard, set gently, and it travels with them long after they leave us.",
  },
]

export function Values() {
  return (
    <section className="section_about-values">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="about-values_wrap">
            <div className="about-values_header">
              <div className="tag is-text">Our Values</div>
              <div className="padding-bottom padding-xxsmall" />
              <h2 className="about-values_heading heading-style-h2">
                At the heart of our school is a culture that{" "}
                <span className="about-values_heading-span">values</span>{" "}
                curiosity, kindness &amp; growth
              </h2>
            </div>

            <div className="padding-bottom padding-huge" />

            <div className="about-values_grid">
              {VALUES.map((v, i) => (
                <div
                  key={v.n}
                  v-card=""
                  className={`about-values_card ${i === 0 ? "is-active" : ""}`.trim()}
                >
                  <div v-card-content="" className="about-values_content">
                    <div className="about-values_img-wrap">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/images/about/values/${v.img}.webp`}
                        alt=""
                        loading="lazy"
                        className="img-auto"
                      />
                    </div>
                    <h3 className="about-values_card-heading heading-style-h3">
                      {v.name}
                    </h3>
                    <p className="text-size-medium">{v.text}</p>
                  </div>
                  <div className="about-values_left-wrap">
                    <div className="about-values_number">{v.n}</div>
                    <div
                      v-card-side-bar-text=""
                      className="about-values_text-vertical"
                    >
                      {v.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <ValuesCards />
    </section>
  )
}
