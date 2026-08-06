// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/investors) — UI and motion verbatim, heading
// rewritten for the school tenant. Renders under the `.zenda-clone` CSS scope
// (see src/styles/zenda-clone.css).

/**
 * About "Our Partners" — a centred heading over a row of logos at per-brand
 * widths, multiply-blended into the beige page. Static.
 *
 * ⚠️ BLOCKING BEFORE ANY REAL TENANT PUBLISHES THIS PAGE. The four logos are
 * still the reference site's actual venture investors (STV, COTU, VentureSouq,
 * GFC) — real firms that have no relationship with any school on this platform.
 * A logo row under a heading reads as an endorsement, so this is a fabricated
 * credential of exactly the kind the block forbids ("never invent a person or
 * an institution … no fake accreditation logos" — see the block CLAUDE.md).
 * Swap in partners the school genuinely has, or delete this section and its
 * <Investors/> line from content.tsx. It is kept for now only so the page's
 * section rhythm can be reviewed.
 */
const PARTNERS = ["stv", "cotu", "venturesouq", "gfc"] as const

export function Investors() {
  return (
    <section className="section_about-investors">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-medium">
          <div className="about-investors_wrap">
            <h2 className="about-investors_heading heading-style-h2">
              Our Partners
            </h2>

            <div className="padding-bottom padding-large" />

            <div className="about-investors_grid">
              {PARTNERS.map((key) => (
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
