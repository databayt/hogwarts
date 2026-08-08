// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported from zenda (home/cta). Renders under the `.zenda-clone` CSS scope
// (see src/styles/zenda-clone.css).
//
// One deviation from the source: the App Store download is replaced with the
// application wizard -- the school has no app on any store.

/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react"

import type { Dictionary } from "@/components/internationalization/dictionaries"

const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"
const IMG = "682589730e02cca2610e3d54_footer-cta-img"

export function CTA({
  lang = "en",
  dictionary,
}: {
  lang?: string
  dictionary?: Dictionary
}) {
  const applyBtn =
    dictionary?.marketing?.site?.home?.cta?.button ?? "Start Application"

  return (
    <section className="section_cta">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="cta_wrap">
            <div className="cta_content">
              <h2 className="cta_heading heading-style-h2">
                {dictionary?.marketing?.site?.home?.cta?.heading ??
                  "Parenting isn't easy, applying to school should be!"}
              </h2>
              <div className="padding-bottom padding-large"></div>
              <div className="max-width-small align-center">
                <div className="button_component">
                  <a
                    href={`/${lang}/application`}
                    className="button-v2 w-inline-block is-alternate is-no-cap"
                  >
                    <span className="button-v2_bg is-alternate is-no-cap">
                      <span
                        style={{ "--index": 0 } as CSSProperties}
                        className="button-v2_bg-inner is-first is-alternate is-no-cap"
                      ></span>
                      <span
                        style={{ "--index": 1 } as CSSProperties}
                        className="button-v2_bg-inner is-second is-alternate is-no-cap"
                      ></span>
                    </span>
                    <span data-text={applyBtn} className="button-v2_inner">
                      <span className="button-v2_text">{applyBtn}</span>
                    </span>
                  </a>
                </div>
              </div>
            </div>

            {/* footer illustration — absolutely positioned, pulled up so it pops out the top of the dark card */}
            <div className="cta_img-wrap">
              <img
                src={CDN + IMG + ".webp"}
                loading="lazy"
                sizes="100vw"
                srcSet={[
                  `${CDN}${IMG}-p-500.webp 500w`,
                  `${CDN}${IMG}-p-800.webp 800w`,
                  `${CDN}${IMG}-p-1080.webp 1080w`,
                  `${CDN}${IMG}-p-1600.webp 1600w`,
                  `${CDN}${IMG}-p-2000.webp 2000w`,
                  `${CDN}${IMG}.webp 2237w`,
                ].join(", ")}
                alt=""
                className="img-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
