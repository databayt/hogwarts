// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/how-it-works). Renders under the
// `.zenda-clone` CSS scope (see src/styles/zenda-clone.css).

/* eslint-disable @next/next/no-img-element */

import { HiwScroll } from "./hiw-scroll"

const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"

type Block = { h: string; img: string; wrap: string; p: string }

const B: Record<string, Block> = {
  uniform: {
    h: "Uniform",
    img: CDN + "67ecd573d52fd02665fc093c_Group%201244838934.webp",
    wrap: "is-uniform",
    p: "New term, new size? Get that uniform without the mall crawl",
  },
  activities: {
    h: "Activities",
    img: CDN + "67ecd57339122da7a049c1c3_Group%202147226802.webp",
    wrap: "is-activites",
    p: "Ballet? Basketball? Sign 'em up while sipping your coffee.",
  },
  trips: {
    h: "Trips & Tours",
    img: CDN + "67ecd5738b42c09836a6a451_Group%202147226814.webp",
    wrap: "is-bagpack",
    p: "No last-minute hunts—pay for trips before the chaos begins!",
  },
  transport: {
    h: "Transport",
    img: CDN + "67ecd5746a265afb0ef69250_Group%202147226817.webp",
    wrap: "is-transpot",
    p: "Bus fee? Click, pay, done. No reminders, just easy rides.",
  },
  fees: {
    h: "Tuition Fees",
    img: CDN + "67ecd573618ad39b90780be1_Group%202147226818.webp",
    wrap: "is-fees",
    p: "Pay fees without breaking a sweat—or your routine.",
  },
  canteen: {
    h: "Canteen",
    img: CDN + "67ecd5731a9f1c4f49ce8fa4_Group%202147226801.webp",
    wrap: "is-canteen",
    p: "‘What to pack for lunch’ dilemma? Relax, we've got you.",
  },
  events: {
    h: "Events",
    img: CDN + "67ecd573745cd68d0ee5b361_Group%202147226812.webp",
    wrap: "is-events",
    p: "School play, talent day, colour run? Pay now, cheer later.",
  },
  supplies: {
    h: "Supplies",
    img: CDN + "67ecd57301080e715ed55b09_Group%202147226813.webp",
    wrap: "is-supplies",
    p: "Notebooks, pens, the odd glue stick? We’ve got your back.",
  },
  exams: {
    h: "Exams",
    img: CDN + "6867786909fd44c183a35f1e_Exams.webp",
    wrap: "is-exams",
    p: "Exam prep is hard. Exam fee payment shouldn’t be.",
  },
  counselling: {
    h: "Counselling",
    img: CDN + "686776b7c313e2af8a057eb6_Counselling.webp",
    wrap: "is-counselling",
    p: "Mental wellness is a click away. No forms. Just care.",
  },
}

type Col = { track: "up" | "down"; cls: string; items: (keyof typeof B)[] }

const COLUMNS: Col[] = [
  { track: "up", cls: "", items: ["uniform", "activities", "trips"] },
  {
    track: "down",
    cls: "is-bottom-align",
    items: ["transport", "fees", "canteen"],
  },
  {
    track: "up",
    cls: "hide-mobile-landscape",
    items: ["events", "supplies", "exams"],
  },
  {
    track: "down",
    cls: "is-bottom-align hide-tablet",
    items: ["uniform", "counselling", "activities"],
  },
]

function MarqueeBlock({ b }: { b: Block }) {
  return (
    <div className="hiw_marquee_block">
      <h3 className="hiw_marquee_heading heading-style-h5">{b.h}</h3>
      <div className={`hiw_marquee_img-wrap ${b.wrap}`}>
        <img src={b.img} loading="lazy" alt="" className="img-auto" />
      </div>
      <div className="text-wrap-balance">
        <p className="text-size-small">{b.p}</p>
      </div>
    </div>
  )
}

function Columns() {
  return (
    <>
      {COLUMNS.map((col, i) => (
        <div
          key={i}
          {...({ "hiw-marquee-track": col.track } as Record<string, string>)}
          className={`hiw_marquee_col ${col.cls}`.trim()}
        >
          {col.items.map((key, j) => (
            <MarqueeBlock key={j} b={B[key]} />
          ))}
        </div>
      ))}
    </>
  )
}

export function HowItWorks() {
  return (
    <section className="section_hiw">
      <div className="padding-global-small-v2 padding-section-large">
        <div className="container-xlarge">
          <div hiw-wrap="" className="hiw_parent">
            <div hiw-content-wrap="" className="hiw_wrap">
              <div className="hiw_header">
                <div hiw-element="" className="tag is-text">
                  HOW IT WORKS
                </div>
                <div className="padding-bottom padding-xxsmall"></div>
                <h2 hiw-element="" className="hiw_heading heading-style-h2">
                  Transform the way you pay fees
                </h2>
              </div>

              <div className="hiw_marquee_component">
                {/* Desktop: 4 scroll-parallax columns */}
                <div hiw-marquee-wrap="" className="hiw_marquee_wrap">
                  <Columns />
                </div>

                {/* Mobile/tablet: two continuously-scrolling tracks */}
                <div className="hiw_marquee_m_grid">
                  <div className="hiw_marquee_m_block">
                    <div className="hiw_marquee_m_wrap">
                      <div m-marquee-track="" className="hiw_marquee_m_track">
                        <div hiw-marquee-wrap="" className="hiw_marquee_m_list">
                          <Columns />
                        </div>
                      </div>
                      <div m-marquee-track="" className="hiw_marquee_m_track">
                        <div hiw-marquee-wrap="" className="hiw_marquee_m_list">
                          <Columns />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="hiw_marquee_m_block is-reverse">
                    <div className="hiw_marquee_m_wrap">
                      <div
                        m-marquee-track-reverse=""
                        className="hiw_marquee_m_track"
                      >
                        <div hiw-marquee-wrap="" className="hiw_marquee_m_list">
                          <Columns />
                        </div>
                      </div>
                      <div
                        m-marquee-track-reverse=""
                        className="hiw_marquee_m_track"
                      >
                        <div hiw-marquee-wrap="" className="hiw_marquee_m_list">
                          <Columns />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hiw_marquee_bg"></div>
                <div className="hiw_marquee_bg is-bottom"></div>
              </div>
            </div>

            <div hiw-grid-wrap="" className="hiw_grid">
              <div hiw-grid-item="" className="hiw_item">
                <h3 className="hiw_sub-heading heading-style-h3">$2Bn+</h3>
                <p className="hiw_sub-para heading-style-h5">
                  Institutions
                  <br />
                  tuition fees
                </p>
              </div>
              <div hiw-grid-item="" className="hiw_item">
                <h3 className="hiw_sub-heading heading-style-h3">150k+ </h3>
                <p className="hiw_sub-para heading-style-h5">
                  Parents <br />
                  globally
                </p>
              </div>
              <div hiw-grid-item="" className="hiw_item">
                <h3 className="hiw_sub-heading heading-style-h3">4.8</h3>
                <p className="hiw_sub-para heading-style-h5">
                  Avg. rating on
                  <br />
                  play store
                </p>
              </div>
            </div>

            <HiwScroll />
          </div>
        </div>
      </div>
    </section>
  )
}
