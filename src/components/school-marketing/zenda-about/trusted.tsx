// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (about/trusted). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

/**
 * About "Trusted by the best" — a centred heading over a row of school-council
 * logos at per-brand widths, darken-blended into the beige. Static. Ported from
 * zenda.com/about-us.
 */
const LOGOS = [
  {
    key: "nesa",
    alt: "NESA — Near East South Asia Council of Overseas Schools",
  },
  { key: "fobisia", alt: "FOBISIA" },
  { key: "bsme", alt: "BSME — British Schools in the Middle East" },
  { key: "earcos", alt: "EARCOS — East Asia Regional Council of Schools" },
] as const

export function Trusted() {
  return (
    <section className="section_trusted">
      <div className="padding-global-v2 padding-section-large">
        <div className="trusted_wrap">
          <h2 className="trusted_heading heading-style-h2">
            Trusted by the best
          </h2>
          <div className="padding-bottom padding-xxlarge" />
          <div className="trusted_grid">
            {LOGOS.map(({ key, alt }) => (
              <div key={key} className={`trusted_img-wrap is-${key}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/about/trusted/${key}.webp`}
                  alt={alt}
                  loading="lazy"
                  className="img-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
