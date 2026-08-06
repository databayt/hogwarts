// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/team) — UI and motion verbatim, copy rewritten for
// the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css).

/**
 * About "Our Team" — a centred header over an infinite horizontal marquee of
 * photos, with a few soft beige blocks floating behind. The marquee is two
 * identical tracks side by side, both translating -100% on a continuous loop (a
 * pure CSS animation — the reference drives the same thing with GSAP). A couple
 * of odd-aspect shots use the reference's `about_team_marquee_img` crop instead
 * of object-fit: cover.
 *
 * ⚠️ PLACEHOLDER IMAGERY, AND SOME OF IT IS WRONG FOR A SCHOOL. These are still
 * the reference company's own staff-offsite photos: among them are a party lit
 * in club purple and a billiards table. Nobody is named, so no individual is
 * presented as this school's staff — but "Our Team" over a night-out collage is
 * off-key on any school site, and plainly unacceptable for the conservative
 * markets this product sells into. Swap all nineteen for the tenant's own
 * campus photography before publishing. Keep the group/kind mix when you do:
 * the row rhythm (base, base, rotate, large) is what makes it read as a collage.
 */

type Kind = "base" | "large" | "rotate"
type Photo = { src: string; kind: Kind; crop?: boolean; topAlign?: boolean }

// Five groups of photos; the marquee renders this list, then repeats it.
const ROWS: Photo[][] = [
  [
    { src: "tes01301", kind: "base" },
    { src: "tes09409", kind: "base" },
    { src: "tes08780", kind: "rotate" },
    { src: "tes01213", kind: "large" },
  ],
  [
    { src: "tes01631", kind: "base" },
    { src: "tes00379", kind: "base" },
    { src: "img9508", kind: "rotate" },
    { src: "tes01464", kind: "large" },
  ],
  [
    { src: "tes01570", kind: "base" },
    { src: "img6808", kind: "base" },
    { src: "img7997", kind: "rotate", crop: true },
    { src: "img20250614", kind: "large" },
  ],
  [
    { src: "tes00586", kind: "base" },
    { src: "img0026", kind: "base" },
    { src: "tes01099", kind: "rotate", crop: true, topAlign: true },
    { src: "img674", kind: "large" },
  ],
  [
    { src: "offsit", kind: "base" },
    { src: "img1220", kind: "base" },
    { src: "tes00489", kind: "large" },
  ],
]

const KIND_CLASS: Record<Kind, string> = {
  base: "",
  large: "is-large",
  rotate: "is-large-rotate",
}

function MarqueeList() {
  return (
    <div className="about-team_marquee_list">
      {ROWS.map((row, ri) => (
        <div key={ri} className="about-team_marquee_list-item">
          {row.map((p, pi) => (
            <div
              key={pi}
              className={`about-team_marquee_item ${KIND_CLASS[p.kind]}`.trim()}
            >
              <div
                className={`about-team_marquee_img-wrap ${p.crop ? "is-game-over" : ""}`.trim()}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/about/team/${p.src}.webp`}
                  alt=""
                  loading="lazy"
                  className={
                    p.crop
                      ? `about_team_marquee_img ${p.topAlign ? "is-top-align" : ""}`.trim()
                      : "img-cover"
                  }
                />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function Team() {
  return (
    <section className="section_about-team">
      <div className="padding-global-v2">
        <div className="container-large">
          <div className="about-team_wrap">
            <div className="about-team_header">
              <h2 className="about-team_heading heading-style-h2">Our Team</h2>
              <div className="padding-bottom padding-small" />
              <p className="heading-style-h4 font-dm-sans">
                A great school is a room full of adults who care intensely about
                every child in front of them
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="about-team_marquee_component">
        <div className="about-team_marquee_wrap">
          {/* Two identical tracks → seamless loop. */}
          <div marquee-track="" className="about-team_marquee_track">
            <MarqueeList />
          </div>
          <div
            marquee-track=""
            className="about-team_marquee_track"
            aria-hidden="true"
          >
            <MarqueeList />
          </div>
        </div>
      </div>

      <div className="about-team_bg-wrap">
        <div className="about-team_bg-block" />
        <div className="about-team_bg-block is-2nd" />
        <div className="about-team_bg-block is-3rd" />
        <div className="about-team_bg-block is-4th" />
      </div>
    </section>
  )
}
