// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Ported verbatim from zenda (home/schools). Renders under the `.zenda-clone`
// CSS scope (see src/styles/zenda-clone.css).

/* eslint-disable @next/next/no-img-element */
import Link from "next/link"

import { InstitutesLottie } from "./schools-lottie"
import { SchoolsScroll } from "./schools-scroll"

const CDN = "https://cdn.prod.website-files.com/622da43f87e21836ee21bed6/"
const LOCATION_ICON = CDN + "67e397d50fcc10ce71f963a4_IcBaselineLocationOn.svg"

const LOGOS = [
  CDN + "68f1ec48cc96ed312abad7d2_Arbor.png",
  CDN + "68f1ec48c8fa1b940449088a_Amity%20Abu%20Dhabi.png",
  CDN + "68f1ec48d16a6cda10f99ce9_Nord%20Anglia.png",
  CDN + "68f1ec485ba2216629bdd4f2_Repton.png",
  CDN + "68f1ec482456eae5b05ec3b0_North%20Collegiate.png",
  CDN + "67f6139c26e5b2c9743ddc08_school-logo07.webp",
  CDN + "67f6139c7eb8b47b585febf1_school-logo08.webp",
  CDN + "67f6139c6629053730c83d34_school-logo09.webp",
  CDN + "67f6139c653aa4aead67d967_school-logo10.webp",
  CDN + "67f6139b6629053730c83d20_school-logo11.webp",
  CDN + "68f1ec486b1b742bee7409d0_Raffles.png",
  CDN + "67f6139b8894ac8994256618_school-logo06.webp",
]

export function Schools() {
  return (
    <section id="schools" className="section_schools">
      <div className="padding-global-v2 padding-section-large">
        <div className="container-large">
          <div className="schools_wrap">
            <div school-wrap="" className="schools_header-wrap">
              <div className="schools_header">
                <div school-icon="" className="schools_icon-wrap">
                  <img
                    src={LOCATION_ICON}
                    loading="lazy"
                    alt=""
                    className="img-auto"
                  />
                </div>
                <div school-element="" className="tag is-text">
                  SCHOOLS
                </div>
                <h2
                  school-element=""
                  className="schools_heading heading-style-h2"
                >
                  Trusted by 450+ institutions
                </h2>
                <p school-element="" className="schools_para">
                  for managing payments and financial operations
                </p>
              </div>

              <div className="schools_lottie-wrap">
                <InstitutesLottie />
              </div>
            </div>

            <div className="schools_content_wrap">
              <h3 className="schools_content_heading heading-style-h3">
                Integrated. Automated. Enabled
              </h3>
              <p className="text-size-medium">
                As the school&rsquo;s fintech partner, zenda offers financial
                services that are built-to-context. zenda&rsquo;s technology is
                customised at the very core,&nbsp;to overcome bottlenecks in
                education payments.
              </p>
            </div>

            <div className="schools_logo-component">
              <div className="schools_grid">
                {LOGOS.map((src) => (
                  <div key={src} className="schools_item">
                    <div className="schools_logo-wrap">
                      <img
                        src={src}
                        loading="lazy"
                        width={140}
                        height={140}
                        alt=""
                        className="img-auto"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="button_component">
                <Link href="/for-schools" className="button-v2 w-inline-block">
                  <span className="button-v2_bg">
                    <span
                      style={{ "--index": 0 } as React.CSSProperties}
                      className="button-v2_bg-inner is-first"
                    ></span>
                    <span
                      style={{ "--index": 1 } as React.CSSProperties}
                      className="button-v2_bg-inner is-second"
                    ></span>
                  </span>
                  <span data-text="Explore" className="button-v2_inner">
                    <span className="button-v2_text">Explore</span>
                  </span>
                </Link>
              </div>
            </div>

            <SchoolsScroll />
          </div>
        </div>
      </div>
    </section>
  )
}
