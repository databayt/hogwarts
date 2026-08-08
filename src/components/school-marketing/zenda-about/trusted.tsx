// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (about/trusted) — UI and motion verbatim. Renders under the
// `.zenda-clone` CSS scope (see src/styles/zenda-clone.css).

import type { Dictionary } from "@/components/internationalization/dictionaries"

/**
 * About "Trusted by the best" — a centred heading over a row of school-council
 * logos at per-brand widths, darken-blended into the beige. Static.
 *
 * ⚠️ BLOCKING BEFORE ANY REAL TENANT PUBLISHES THIS PAGE. These are the real
 * marks of four real accrediting bodies — NESA, FOBISIA, BSME and EARCOS — and
 * a school showing them under "Trusted by the best" is claiming a membership or
 * accreditation it does not have. That is a fabricated credential, banned by
 * the block's own rule ("never invent a person or an institution … no fake
 * accreditation logos" — see the block CLAUDE.md), and it is the kind of claim
 * a parent would act on. The heading is deliberately left as the reference
 * wrote it rather than reworded, because no wording makes these logos true:
 * either swap them for bodies the school is genuinely accredited by, or delete
 * this section and its <Trusted/> line from content.tsx. Kept for now only so
 * the page's section rhythm can be reviewed. Copy (heading + alt text) now
 * lives at marketing.site.about.trusted in en.json/ar.json — translation does
 * not fix the underlying claim, only the fallback strings below still name it.
 */
const LOGOS_FALLBACK = {
  nesa: "NESA — Near East South Asia Council of Overseas Schools",
  fobisia: "FOBISIA",
  bsme: "BSME — British Schools in the Middle East",
  earcos: "EARCOS — East Asia Regional Council of Schools",
} as const

const LOGO_KEYS = ["nesa", "fobisia", "bsme", "earcos"] as const

export function Trusted({ dictionary }: { dictionary?: Dictionary }) {
  const t = dictionary?.marketing?.site?.about?.trusted
  return (
    <section className="section_trusted">
      <div className="padding-global-v2 padding-section-large">
        <div className="trusted_wrap">
          <h2 className="trusted_heading heading-style-h2">
            {t?.heading ?? "Trusted by the best"}
          </h2>
          <div className="padding-bottom padding-xxlarge" />
          <div className="trusted_grid">
            {LOGO_KEYS.map((key) => (
              <div key={key} className={`trusted_img-wrap is-${key}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/images/about/trusted/${key}.webp`}
                  alt={t?.logos?.[key] ?? LOGOS_FALLBACK[key]}
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
