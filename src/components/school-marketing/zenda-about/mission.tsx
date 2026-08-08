// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/mission) — UI and motion verbatim, copy rewritten
// for the school tenant. Renders under the `.zenda-clone` CSS scope (see
// src/styles/zenda-clone.css).

import type { Dictionary } from "@/components/internationalization/dictionaries"

/**
 * About "Our Mission" — a two-column block: on the left a purple eyebrow,
 * heading and an illustration; on the right a white rounded card with three
 * paragraphs. Static.
 */

// English fallback values — see marketing.site.about.mission in en.json/ar.json
// for the live copy this renders when a dictionary is supplied.
const PARAGRAPHS_FALLBACK = [
  "A child spends more waking hours with us than almost anywhere else. That time should be spent being known, not just taught.",
  "So we keep classes small enough that every teacher can name what each student is good at, and honest enough that families hear about a struggle early, while it is still easy to fix.",
  "Not a factory that moves children through by age, but a school built around how they actually learn - so they leave us curious, capable and sure of themselves.",
]

export function Mission({ dictionary }: { dictionary?: Dictionary }) {
  const t = dictionary?.marketing?.site?.about?.mission
  const paragraphs = [
    t?.paragraph1 ?? PARAGRAPHS_FALLBACK[0],
    t?.paragraph2 ?? PARAGRAPHS_FALLBACK[1],
    t?.paragraph3 ?? PARAGRAPHS_FALLBACK[2],
  ]
  return (
    <section className="section_about-mission">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="about-mission_wrap">
            <div className="about-mission_content-left">
              <div className="about-mission_header">
                <div className="tag is-text">{t?.eyebrow ?? "Our Mission"}</div>
                <h2 className="about-mission_heading heading-style-h2">
                  {t?.heading ?? "We are here so every child is known by name."}
                </h2>
              </div>
              <div className="about-mission_img-wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/about/mission.webp"
                  alt={
                    t?.imageAlt ??
                    "Illustration of a diverse group celebrating together"
                  }
                  loading="lazy"
                  className="img-auto"
                />
              </div>
            </div>

            <div className="about-mission_content">
              {paragraphs.map((para, i) => (
                <p key={i} className="heading-style-h5 font-dm-sans">
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
