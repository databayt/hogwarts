// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/investors). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

/**
 * About "Our Investors" — a centred heading over a row of investor logos at
 * per-brand widths, multiply-blended into the beige page. Static. Ported from
 * zenda.com/about-us.
 */
const INVESTORS = ["stv", "cotu", "venturesouq", "gfc"] as const

export function Investors() {
  return (
    <section className="section_about-investors">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-medium">
          <div className="about-investors_wrap">
            <h2 className="about-investors_heading heading-style-h2">
              Our Investors
            </h2>

            <div className="padding-bottom padding-large" />

            <div className="about-investors_grid">
              {INVESTORS.map((key) => (
                <div key={key} className={`about-investors_block is-${key}`}>
                  <div className="about-investors_logo">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/images/about/investors/${key}.webp`}
                      alt={`${key} logo`}
                      loading="lazy"
                      className="img-auto"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
