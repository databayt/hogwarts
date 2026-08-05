// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/values). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

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
    text: "At zenda, we see every school and family as a long-term partner. That’s why we listen closely, build with care, and show up—consistently. Trust in education isn’t a one-time win; it’s earned every day. And that’s exactly what we aim to do.",
  },
  {
    n: "02",
    name: "Stronger together",
    img: "together",
    text: "We believe real care means lifting each other up while pushing for growth. We celebrate wins, learn from mistakes, and blend fun with meaningful work. Because when we’re in it together, challenges become easier and successes more rewarding",
  },
  {
    n: "03",
    name: "Build for Impact",
    img: "impact",
    text: "We don’t adapt generic solutions—we design from scratch, grounded in the realities of schools and families. Excellence means creating what hasn’t existed before, with care, conviction, and impactful innovation that truly makes a difference.",
  },
  {
    n: "04",
    name: "Take Charge, Move Fast",
    img: "charge",
    text: "We take responsibility—fully, leading by example with urgency and decisiveness - owning outcomes assertively. For us, ownership means caring deeply, acting boldly, and delivering with pride. It’s about setting a high standard through swift, confident action—and inspiring others around us to rise with us.",
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
                At the heart of our organisation is a culture that{" "}
                <span className="about-values_heading-span">values</span>{" "}
                creativity, collaboration &amp; growth
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
