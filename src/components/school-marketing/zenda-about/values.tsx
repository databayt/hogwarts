// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/values) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css).

import type { Dictionary } from "@/components/internationalization/dictionaries"

import { ValuesCards } from "./values-cards"

/**
 * About "Our Values" — a heading with a highlighted "values" pill over an
 * expanding accordion of four value cards. One card is open (light-blue, content
 * shown); the rest collapse to a numbered column with a vertical label. The
 * hover/tap interaction lives in <ValuesCards/> (GSAP). Ported from
 * zenda.com/about-us.
 */

type Value = { n: string; name: string; img: string; text: string }

// `img` slugs are design assets, not copy — they stay out of the dictionary
// and index-aligned with the four dictionary items below. Re-arting these
// also re-arts the academic /stage-accordion icons (see school-marketing.css).
const IMG_SLUGS = ["trust", "together", "impact", "charge"]

// English fallback, also the values stored at
// marketing.site.about.values.items — read from the dictionary below and
// zipped by index against IMG_SLUGS.
const VALUES_FALLBACK: Array<{ n: string; name: string; text: string }> = [
  {
    n: "01",
    name: "Rooted in Trust",
    text: "We see every family as a long-term partner. That’s why we listen closely, teach with care, and tell you the truth early—about a strong term and a hard one alike. Trust in a school isn’t won at open day; it’s earned every morning at the gate.",
  },
  {
    n: "02",
    name: "Stronger together",
    text: "Real care means lifting each other up while still pushing for growth. Our students celebrate a classmate’s win, learn out loud from mistakes, and work in groups more often than alone. Because when children are in it together, hard things get easier and good things get bigger.",
  },
  {
    n: "03",
    name: "Teach for Mastery",
    text: "We don’t rush a class past a topic because the calendar says so. Lessons are built from where our students actually are, and we stay with a concept until it’s genuinely theirs. Excellence here means understanding that lasts long after the exam.",
  },
  {
    n: "04",
    name: "Own Your Learning",
    text: "We ask students to take responsibility—for their work, their word, and the room they share. Ownership means asking the question you’re afraid to ask, finishing what you started, and taking pride in it. It’s a high standard, set gently, and it travels with them long after they leave us.",
  },
]

function getValues(dictionary?: Dictionary): Value[] {
  const items = dictionary?.marketing?.site?.about?.values?.items as
    | Array<{ n: string; name: string; text: string }>
    | undefined

  const source = items ?? VALUES_FALLBACK

  return IMG_SLUGS.map((img, i) => ({
    ...(source[i] ?? VALUES_FALLBACK[i]),
    img,
  }))
}

export function Values({ dictionary }: { dictionary?: Dictionary }) {
  const t = dictionary?.marketing?.site?.about?.values
  const VALUES = getValues(dictionary)

  return (
    <section className="section_about-values">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="about-values_wrap">
            <div className="about-values_header">
              <div className="tag is-text">{t?.tag ?? "Our Values"}</div>
              <div className="padding-bottom padding-xxsmall" />
              <h2 className="about-values_heading heading-style-h2">
                {t?.heading?.before ??
                  "At the heart of our school is a culture that"}{" "}
                <span className="about-values_heading-span">
                  {t?.heading?.highlight ?? "values"}
                </span>{" "}
                {t?.heading?.after ?? "curiosity, kindness & growth"}
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
